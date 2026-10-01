-- Place this LocalScript in StarterPlayer > StarterPlayerScripts.
-- Report only the local player's experience chat; the server filters messages
-- again before sending them to the Honolua dashboard.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TextChatService = game:GetService("TextChatService")

local player = Players.LocalPlayer
local report = ReplicatedStorage:WaitForChild("HonoluaChatReport")

local function reportOwnMessage(message)
	local source = message and message.TextSource
	local text = message and message.Text
	if not source or source.UserId ~= player.UserId or type(text) ~= "string" or text == "" then
		return
	end
	report:FireServer(text, message.MessageId)
end

-- SendingMessage catches messages at the point the local player sends them;
-- MessageReceived catches accepted, filtered responses. The server deduplicates
-- these paths by Roblox's MessageId and message text.
TextChatService.SendingMessage:Connect(reportOwnMessage)
TextChatService.MessageReceived:Connect(reportOwnMessage)

-- Preserve any existing message styling callback while observing the accepted
-- local message on experiences where Roblox invokes developer callbacks.
local previousCallback = TextChatService.OnIncomingMessage
TextChatService.OnIncomingMessage = function(message)
	local results = previousCallback and table.pack(previousCallback(message)) or table.pack()
	if message and message.Status == Enum.TextChatMessageStatus.Success then
		reportOwnMessage(message)
	end
	return table.unpack(results, 1, results.n)
end
