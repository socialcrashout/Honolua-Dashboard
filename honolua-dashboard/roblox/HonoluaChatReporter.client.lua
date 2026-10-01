-- Place this LocalScript in StarterPlayer > StarterPlayerScripts.
-- Report only the local player's experience chat; the server filters messages
-- again before sending them to the Honolua dashboard.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TextChatService = game:GetService("TextChatService")
local HttpService = game:GetService("HttpService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local report = ReplicatedStorage:WaitForChild("HonoluaChatReport")
local activityState = ReplicatedStorage:WaitForChild("HonoluaActivityState")
local watchedChannels = {}
local reportedMessages = setmetatable({}, { __mode = "k" })
local pendingById = {}
local pendingByText = {}
local isAfk = false

player.Idled:Connect(function()
	if not isAfk then
		isAfk = true
		activityState:FireServer("afk_start")
	end
end)

UserInputService.InputBegan:Connect(function()
	if isAfk then
		isAfk = false
		activityState:FireServer("afk_end")
	end
end)

local function discardExpiredPending()
	local now = os.clock()
	for id, pending in pairs(pendingById) do
		if now - pending.at > 8 then
			pendingById[id] = nil
			if pendingByText[pending.text] == pending then
				pendingByText[pending.text] = nil
			end
		end
	end
	for text, pending in pairs(pendingByText) do
		if now - pending.at > 8 then
			pendingByText[text] = nil
		end
	end
end

local function rememberOwnMessage(message)
	discardExpiredPending()
	local text = message and message.Text
	if type(text) ~= "string" or text == "" then
		return
	end
	local pending = { text = text, at = os.clock(), messageId = message.MessageId }
	if type(pending.messageId) == "string" and pending.messageId ~= "" then
		pendingById[pending.messageId] = pending
	end
	pendingByText[text] = pending
end

local function reportAcceptedMessage(message)
	discardExpiredPending()
	if not message or message.Status ~= Enum.TextChatMessageStatus.Success then
		return
	end
	local text = message.Text
	if type(text) ~= "string" or text == "" then
		return
	end
	local source = message.TextSource
	if source and source.UserId ~= player.UserId then
		return
	end
	local messageId = message.MessageId
	local pending = type(messageId) == "string" and pendingById[messageId] or nil
	if not pending and not source then
		local byText = pendingByText[text]
		if byText and os.clock() - byText.at <= 8 then
			pending = byText
		end
	end
	if not source and not pending then
		return
	end
	if reportedMessages[message] then
		return
	end
	reportedMessages[message] = true
	if type(messageId) ~= "string" or messageId == "" then
		messageId = pending and pending.messageId
	end
	if type(messageId) ~= "string" or messageId == "" then
		messageId = HttpService:GenerateGUID(false)
	end
	if pending then
		if pending.messageId then pendingById[pending.messageId] = nil end
		if pendingByText[pending.text] == pending then pendingByText[pending.text] = nil end
	end
	-- This is the accepted, filtered text. The server filters it again before
	-- saving or forwarding it to the dashboard.
	report:FireServer(text, messageId)
end

TextChatService.SendingMessage:Connect(rememberOwnMessage)
TextChatService.MessageReceived:Connect(reportAcceptedMessage)

local function watchChannel(instance)
	if not instance:IsA("TextChannel") or watchedChannels[instance] then
		return
	end
	watchedChannels[instance] = true
	instance.MessageReceived:Connect(reportAcceptedMessage)
end

for _, descendant in TextChatService:GetDescendants() do
	watchChannel(descendant)
end
TextChatService.DescendantAdded:Connect(watchChannel)
