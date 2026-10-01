-- Place this as a Script in ServerScriptService (never LocalScript).
-- Store the same secret value under HONOLUA_ACTIVITY_SECRET in Roblox Secrets
-- and Vercel's ROBLOX_ACTIVITY_SECRET environment variable.

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local TextService = game:GetService("TextService")

local GROUP_ID = 743137138
local ENDPOINT = "https://honolua-dashboard.vercel.app/api/activity/ingest"
local EXPERIENCE_NAME = "Honolua"
local SECRET_NAME = "HONOLUA_ACTIVITY_SECRET"
local HEARTBEAT_SECONDS = 45
local MAX_ATTEMPTS = 3

local secretOk, activitySecret = pcall(function()
	return HttpService:GetSecret(SECRET_NAME)
end)
if not secretOk then
	warn("Honolua activity tracker is waiting for the HONOLUA_ACTIVITY_SECRET Roblox experience secret.")
	return
end

local serverId = game.JobId
if serverId == "" then
	serverId = "studio-" .. HttpService:GenerateGUID(false)
end

local sessionId = HttpService:GenerateGUID(false)
local activePlayers = {}
local recentChatKeys = {}
local capturedMessageIds = {}
local lastDedupeCleanupAt = 0
local closing = false

local function sendEvent(eventName, player, rank, filteredMessage, messageId)
	local payload = {
		event = eventName,
		userId = tostring(player.UserId),
		username = player.Name,
		rank = rank,
		experienceName = EXPERIENCE_NAME,
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
					["Authorization"] = activitySecret:AddPrefix("Bearer "),
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

local function captureChat(player, message, messageId)
	local tracked = activePlayers[player.UserId]
	if not tracked or player.Parent ~= Players or type(message) ~= "string" or message == "" then
		return
	end

	local now = os.clock()
	if now - lastDedupeCleanupAt >= 60 then
		lastDedupeCleanupAt = now
		for key, sentAt in pairs(recentChatKeys) do
			if now - sentAt >= 2 then
				recentChatKeys[key] = nil
			end
		end
		for id, sentAt in pairs(capturedMessageIds) do
			if now - sentAt >= 120 then
				capturedMessageIds[id] = nil
			end
		end
	end
	local dedupeKey = tostring(player.UserId) .. ":" .. message
	if (messageId and capturedMessageIds[messageId]) or now - (recentChatKeys[dedupeKey] or 0) < 2 then
		return
	end
	if messageId then
		capturedMessageIds[messageId] = now
	end
	recentChatKeys[dedupeKey] = now

	local filteredOk, filteredMessage = pcall(function()
		local filterResult = TextService:FilterStringAsync(message, player.UserId, Enum.TextFilterContext.PublicChat)
		return filterResult:GetChatForUserAsync(player.UserId)
	end)
	if not filteredOk or type(filteredMessage) ~= "string" or filteredMessage == "" then
		warn("Honolua activity could not safely filter a chat message for " .. player.Name .. ": " .. tostring(filteredMessage))
		return
	end

	task.spawn(sendEvent, "chat", player, tracked.rank, filteredMessage, messageId or HttpService:GenerateGUID(false))
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

	-- Legacy chat fallback. Modern TextChatService messages are captured by the
	-- server-side delivery callback below.
	player.Chatted:Connect(function(message)
		captureChat(player, message, nil)
	end)
end

-- TextChatService does not reliably surface every modern chat message through
-- Player.Chatted. Observe messages on the server as Roblox delivers them, while
-- chaining any existing delivery policy and preserving its return values.
local textChatService = game:GetService("TextChatService")
local hookedChannels = {}
local function hookTextChannel(channel)
	if hookedChannels[channel] or not channel:IsA("TextChannel") then
		return
	end
	hookedChannels[channel] = true
	local previousCallback = channel.ShouldDeliverCallback
	channel.ShouldDeliverCallback = function(message, textSource)
		local results
		if previousCallback then
			results = table.pack(previousCallback(message, textSource))
		else
			results = table.pack(true)
		end

		-- textSource is the recipient for this delivery check. Attribute the
		-- message to its sender instead, since ShouldDeliverCallback runs once
		-- for each possible recipient.
		local sender = message and message.TextSource
		if results[1] ~= false and sender then
			local player = Players:GetPlayerByUserId(sender.UserId)
			if player then
				task.spawn(captureChat, player, message.Text, message.MessageId)
			end
		end
		return table.unpack(results, 1, results.n)
	end
end

local function hookTextChannels(folder)
	for _, channel in folder:GetChildren() do
		hookTextChannel(channel)
	end
	folder.ChildAdded:Connect(hookTextChannel)
end

-- Chat setup is optional for session tracking. Never block the join and
-- heartbeat handlers waiting for Roblox to create the default chat folder.
local textChannels = textChatService:FindFirstChild("TextChannels")
if textChannels then
	hookTextChannels(textChannels)
else
	textChatService.ChildAdded:Connect(function(child)
		if child.Name == "TextChannels" then
			hookTextChannels(child)
		end
	end)
end

Players.PlayerAdded:Connect(function(player)
	task.spawn(beginTracking, player)
end)

Players.PlayerRemoving:Connect(function(player)
	local tracked = activePlayers[player.UserId]
	activePlayers[player.UserId] = nil
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
