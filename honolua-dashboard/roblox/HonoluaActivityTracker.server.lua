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
local chatRates = {}

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
	if type(messageId) ~= "string" or messageId == "" then
		messageId = nil
	end
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
	local messageKey = messageId and (tostring(player.UserId) .. ":" .. messageId) or nil
	if (messageKey and capturedMessageIds[messageKey]) or (not messageKey and now - (recentChatKeys[dedupeKey] or 0) < 2) then
		return
	end

	local filteredOk, filteredMessage = pcall(function()
		local filterResult = TextService:FilterStringAsync(message, player.UserId, Enum.TextFilterContext.PublicChat)
		return filterResult:GetChatForUserAsync(player.UserId)
	end)
	if not filteredOk or type(filteredMessage) ~= "string" or filteredMessage == "" then
		warn("Honolua activity could not safely filter a chat message for " .. player.Name .. ": " .. tostring(filteredMessage))
		return
	end

	messageId = messageId or HttpService:GenerateGUID(false)
	if messageKey then
		capturedMessageIds[messageKey] = now
	else
		recentChatKeys[dedupeKey] = now
	end
	task.spawn(sendEvent, "chat", player, tracked.rank, filteredMessage, messageId)
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

	-- Roblox's provided chat bar still fires Player.Chatted on the server.
	player.Chatted:Connect(function(message)
		captureChat(player, message, nil)
	end)
end

-- TextChatService client events cover newer chat entry paths. Clients only
-- report messages attributed to themselves; filter again on the server before
-- any message leaves Roblox.
local chatRemote = game:GetService("ReplicatedStorage"):FindFirstChild("HonoluaChatReport")
if not chatRemote then
	chatRemote = Instance.new("RemoteEvent")
	chatRemote.Name = "HonoluaChatReport"
	chatRemote.Parent = game:GetService("ReplicatedStorage")
end
chatRemote.OnServerEvent:Connect(function(player, message, messageId)
	if type(message) ~= "string" or #message > 500 then
		return
	end
	local now = os.clock()
	local rate = chatRates[player.UserId] or { window = now, count = 0 }
	if now - rate.window >= 10 then
		rate = { window = now, count = 0 }
	end
	rate.count += 1
	chatRates[player.UserId] = rate
	if rate.count > 10 then
		return
	end
	if type(messageId) ~= "string" or #messageId > 128 then
		messageId = nil
	end
	captureChat(player, message, messageId)
end)

-- Capture server-observed TextChannel deliveries as a fallback for chat UI
-- paths where the client does not emit TextChatService.MessageReceived.
local TextChatService = game:GetService("TextChatService")
local watchedTextChannels = {}

local function watchTextChannel(instance)
	if not instance:IsA("TextChannel") or watchedTextChannels[instance] then
		return
	end
	watchedTextChannels[instance] = true
	local previousShouldDeliver = instance.ShouldDeliverCallback
	instance.ShouldDeliverCallback = function(message, recipient)
		local shouldDeliver = true
		if previousShouldDeliver then
			local ok, result = pcall(previousShouldDeliver, message, recipient)
			if not ok then
				warn("Honolua activity could not preserve a TextChannel delivery rule: " .. tostring(result))
				return false
			end
			shouldDeliver = result
		end
		local source = message and message.TextSource
		local sender = source and Players:GetPlayerByUserId(source.UserId)
		if shouldDeliver and sender then
			captureChat(sender, message.Text, message.MessageId)
		end
		return shouldDeliver
	end
end

for _, descendant in TextChatService:GetDescendants() do
	watchTextChannel(descendant)
end
TextChatService.DescendantAdded:Connect(watchTextChannel)

Players.PlayerAdded:Connect(function(player)
	task.spawn(beginTracking, player)
end)

Players.PlayerRemoving:Connect(function(player)
	local tracked = activePlayers[player.UserId]
	activePlayers[player.UserId] = nil
	chatRates[player.UserId] = nil
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
