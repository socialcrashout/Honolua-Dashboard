-- Place this as a Script in ServerScriptService (never LocalScript).
-- Set ActivitySecret to the same long random value as Vercel's
-- ROBLOX_ACTIVITY_SECRET environment variable before publishing.

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local TextService = game:GetService("TextService")

local GROUP_ID = 743137138
local ENDPOINT = "https://honolua-dashboard.vercel.app/api/activity/ingest"
local ACTIVITY_SECRET = "SET_THE_SAME_RANDOM_SECRET_IN_VERCEL_AND_HERE"
local HEARTBEAT_SECONDS = 45
local MAX_ATTEMPTS = 3

if ACTIVITY_SECRET == "SET_THE_SAME_RANDOM_SECRET_IN_VERCEL_AND_HERE" then
	warn("Honolua activity tracker is installed but not configured: set ACTIVITY_SECRET and Vercel ROBLOX_ACTIVITY_SECRET.")
	return
end

local serverId = game.JobId
if serverId == "" then
	serverId = "studio-" .. HttpService:GenerateGUID(false)
end

local sessionId = HttpService:GenerateGUID(false)
local activePlayers = {}
local lastChatSentAt = {}
local closing = false

local function sendEvent(eventName, player, rank, filteredMessage, messageId)
	local payload = {
		event = eventName,
		userId = tostring(player.UserId),
		username = player.Name,
		rank = rank,
		serverId = serverId,
		sessionId = sessionId,
		at = DateTime.now():ToIsoDate(),
	}
	if eventName == "chat" then
		payload.message = filteredMessage
		payload.messageId = messageId
		payload.channel = "Experience chat"
	end
	local body = HttpService:JSONEncode(payload)
	local lastError

	for attempt = 1, MAX_ATTEMPTS do
		local ok, response = pcall(function()
			return HttpService:RequestAsync({
				Url = ENDPOINT,
				Method = "POST",
				Headers = {
					["Content-Type"] = "application/json",
					["Authorization"] = "Bearer " .. ACTIVITY_SECRET,
				},
				Body = body,
			})
		end)

		if ok and response.Success then
			return true
		end
		lastError = ok and ("HTTP " .. tostring(response.StatusCode)) or tostring(response)
		if attempt < MAX_ATTEMPTS then
			task.wait(attempt * 2)
		end
	end

	warn(string.format("Honolua activity %s failed for %s: %s", eventName, player.Name, tostring(lastError)))
	return false
end

local function beginTracking(player)
	local ok, rank = pcall(function()
		return player:GetRankInGroupAsync(GROUP_ID)
	end)
	if not ok then
		warn("Honolua activity could not read group rank for " .. player.Name .. ": " .. tostring(rank))
		return
	end
	if player.Parent ~= Players or closing then
		return
	end

	activePlayers[player.UserId] = { player = player, rank = rank }
	sendEvent("join", player, rank)

	player.Chatted:Connect(function(message)
		local now = os.clock()
		if now - (lastChatSentAt[player.UserId] or 0) < 1 then
			return
		end
		lastChatSentAt[player.UserId] = now

		local filteredOk, filteredMessage = pcall(function()
			local filterResult = TextService:FilterStringAsync(message, player.UserId, Enum.TextFilterContext.PublicChat)
			return filterResult:GetChatForUserAsync(player.UserId)
		end)
		if not filteredOk or type(filteredMessage) ~= "string" or filteredMessage == "" then
			warn("Honolua activity could not safely filter a chat message for " .. player.Name)
			return
		end
		task.spawn(sendEvent, "chat", player, rank, filteredMessage, HttpService:GenerateGUID(false))
	end)
end

Players.PlayerAdded:Connect(function(player)
	task.spawn(beginTracking, player)
end)

Players.PlayerRemoving:Connect(function(player)
	local tracked = activePlayers[player.UserId]
	activePlayers[player.UserId] = nil
	lastChatSentAt[player.UserId] = nil
	if tracked then
		task.spawn(sendEvent, "leave", player, tracked.rank)
	end
end)

-- Cover players already present if this script starts after a player joins in Studio.
for _, player in Players:GetPlayers() do
	task.spawn(beginTracking, player)
end

-- A heartbeat keeps the dashboard's live count correct and bounds time after
-- an unexpected server shutdown to at most the heartbeat expiry window.
task.spawn(function()
	while not closing do
		task.wait(HEARTBEAT_SECONDS)
		for userId, tracked in pairs(activePlayers) do
			if tracked.player.Parent == Players then
				task.spawn(sendEvent, "heartbeat", tracked.player, tracked.rank)
			else
				activePlayers[userId] = nil
			end
		end
	end
end)

game:BindToClose(function()
	closing = true
	local pending = 0
	for _, tracked in pairs(activePlayers) do
		pending += 1
		task.spawn(function()
			sendEvent("leave", tracked.player, tracked.rank)
			pending -= 1
		end)
	end
	local deadline = os.clock() + 8
	while pending > 0 and os.clock() < deadline do
		task.wait(0.1)
	end
end)
