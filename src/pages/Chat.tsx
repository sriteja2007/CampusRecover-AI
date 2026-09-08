import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useSearchParams } from "react-router"
import {
  MessageSquare,
  ChevronRight,
  Search,
  Send,
  Image as ImageIcon,
  MoreVertical,
  Loader2,
  CheckCheck,
  Check,
  Circle,
  X,
  Paperclip,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  MapPin,
  Building2,
  ExternalLink,
  Shield,
  Volume2,
  Calendar,
  FileText,
  Smile,
  Ban,
  Flag,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import {
  RealtimeChatService,
  ChatRoom,
  ChatMessage,
  LocationAttachment,
} from "../services/firebase/chat.service"
import { CloudinaryService } from "../services/cloudinary/upload.service"
import { MeetingService } from "../services/firebase/meeting.service"

const SAFE_CAMPUS_SPOTS: LocationAttachment[] = [
  {
    title: "Student Union — Main Info Desk",
    address: "Tresidder Memorial Union, Rm 101",
    lat: 37.4241,
    lng: -122.171,
    isCampusOffice: true,
  },
  {
    title: "Engineering Library Desk",
    address: "Huang Engineering Center, Rm 101",
    lat: 37.4275,
    lng: -122.1742,
    isCampusOffice: true,
  },
  {
    title: "Green Library East Circulation",
    address: "Green Library East, Ground Floor",
    lat: 37.4265,
    lng: -122.167,
    isCampusOffice: true,
  },
  {
    title: "Campus Public Safety & Security",
    address: "281 Bonair Siding, Main Station",
    lat: 37.43,
    lng: -122.175,
    isCampusOffice: true,
  },
  {
    title: "Main Quad Rotunda",
    address: "Memorial Court, Main Quad",
    lat: 37.4276,
    lng: -122.1697,
    isCampusOffice: false,
  },
]

function formatTime(timestamp: any): string {
  if (!timestamp?.toDate) return ""
  const d = timestamp.toDate()
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDateLabel(timestamp: any): string {
  if (!timestamp?.toDate) return ""
  const d = timestamp.toDate()
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return "Today"
  if (diff < 172800000) return "Yesterday"
  return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

export default function Chat() {
  const { user, customUser } = useAuth()
  const [searchParams] = useSearchParams()
  const roomParam = searchParams.get("room")

  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(
    roomParam || null,
  )
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [otherOnline, setOtherOnline] = useState(false)
  const [showMobileList, setShowMobileList] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false)
  const [meetingDate, setMeetingDate] = useState("")
  const [meetingTime, setMeetingTime] = useState("")
  const [meetingOffice, setMeetingOffice] = useState("")
  const [scheduling, setScheduling] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(
    null,
  )

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeRoom = rooms.find((r) => r.id === activeRoomId)
  const otherUserId =
    activeRoom?.participants.find((p) => p !== user?.uid) || ""
  const otherUserName = activeRoom?.participantNames?.[otherUserId] || "User"
  const otherUserPhoto = activeRoom?.participantPhotos?.[otherUserId] || ""

  // Update activeRoomId if roomParam is supplied
  useEffect(() => {
    if (roomParam) {
      setActiveRoomId(roomParam)
      setShowMobileList(false)
    }
  }, [roomParam])

  // Set online presence
  useEffect(() => {
    if (!user) return
    RealtimeChatService.setOnlineStatus(user.uid, true)

    const handleBeforeUnload = () => {
      RealtimeChatService.setOnlineStatus(user.uid, false)
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      RealtimeChatService.setOnlineStatus(user.uid, false)
    }
  }, [user])

  // Subscribe to user rooms
  useEffect(() => {
    if (!user) return
    setLoadingRooms(true)
    const unsub = RealtimeChatService.subscribeToRooms(user.uid, (r) => {
      setRooms(r)
      setLoadingRooms(false)
      if (r.length > 0 && !activeRoomId && !roomParam) {
        setActiveRoomId(r[0].id)
      }
    })
    return unsub
  }, [user, activeRoomId, roomParam])

  // Subscribe to messages in active room
  useEffect(() => {
    if (!activeRoomId) return
    const unsub = RealtimeChatService.subscribeToMessages(
      activeRoomId,
      (msgs) => {
        setMessages(msgs)
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        )
      },
    )
    return unsub
  }, [activeRoomId])

  // Mark as read
  useEffect(() => {
    if (activeRoomId && user) {
      RealtimeChatService.markAsRead(activeRoomId, user.uid)
    }
  }, [activeRoomId, user, messages.length])

  // Subscribe to typing indicator
  useEffect(() => {
    if (!activeRoomId) return
    const unsub = RealtimeChatService.subscribeToTyping(
      activeRoomId,
      (users) => {
        setTypingUsers(users.filter((u) => u !== user?.uid))
      },
    )
    return unsub
  }, [activeRoomId, user])

  // Subscribe to other user online presence
  useEffect(() => {
    if (!otherUserId) return
    const unsub = RealtimeChatService.subscribeToPresence(
      otherUserId,
      (status) => {
        setOtherOnline(status.online)
      },
    )
    return unsub
  }, [otherUserId])

  const handleTyping = useCallback(() => {
    if (!activeRoomId || !user) return
    RealtimeChatService.setTyping(activeRoomId, user.uid, true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      RealtimeChatService.setTyping(activeRoomId, user.uid, false)
    }, 2500)
  }, [activeRoomId, user])

  // Send text message
  const handleSendText = useCallback(async () => {
    if (!messageText.trim() || !activeRoomId || !user) return
    const text = messageText.trim()
    setMessageText("")
    setSending(true)
    try {
      await RealtimeChatService.sendMessage({
        roomId: activeRoomId,
        senderId: user.uid,
        senderName: customUser?.name || "Student",
        senderPhoto: customUser?.photoURL || "",
        text,
        type: "text",
      })
      await RealtimeChatService.setTyping(activeRoomId, user.uid, false)
    } catch (err) {
      console.error("Send failed:", err)
    } finally {
      setSending(false)
    }
  }, [messageText, activeRoomId, user, customUser])

  // Send image attachment
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !activeRoomId || !user) return

      setUploadingImage(true)
      try {
        let imageUrl = ""

        try {
          const result = await CloudinaryService.uploadImage(file)
          imageUrl = result.secure_url
        } catch {
          // Robust fallback: convert to base64 DataURL
          imageUrl = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
        }

        await RealtimeChatService.sendMessage({
          roomId: activeRoomId,
          senderId: user.uid,
          senderName: customUser?.name || "Student",
          senderPhoto: customUser?.photoURL || "",
          type: "image",
          imageUrl,
        })
      } catch (err) {
        console.error("Image upload failed:", err)
      } finally {
        setUploadingImage(false)
      }
    },
    [activeRoomId, user, customUser],
  )

  const handlePdfUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !activeRoomId || !user) return

      setUploadingPdf(true)
      try {
        const pdfUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        await RealtimeChatService.sendMessage({
          roomId: activeRoomId,
          senderId: user.uid,
          senderName: customUser?.name || "Student",
          senderPhoto: customUser?.photoURL || "",
          type: "pdf",
          pdfUrl,
          pdfName: file.name,
        })
      } catch (err) {
        console.error("PDF upload failed:", err)
      } finally {
        setUploadingPdf(false)
      }
    },
    [activeRoomId, user, customUser],
  )

  const handleBlockUser = async () => {
    if (!activeRoomId || !user) return
    await RealtimeChatService.blockUser(activeRoomId, user.uid)
    setShowMenu(false)
  }

  const handleReportConversation = async () => {
    if (!activeRoomId || !user) return
    await RealtimeChatService.reportConversation(activeRoomId, user.uid, "Inappropriate behavior")
    setShowMenu(false)
  }

  const handleScheduleMeeting = async () => {
    if (!activeRoomId || !user || !meetingDate || !meetingTime || !meetingOffice) return
    setScheduling(true)
    try {
      const officeTitle = SAFE_CAMPUS_SPOTS.find(s => s.address === meetingOffice)?.title || meetingOffice
      await MeetingService.requestMeeting({
        matchId: activeRoom?.matchId || "",
        roomId: activeRoomId,
        requesterId: user.uid,
        responderId: otherUserId,
        officeName: officeTitle,
        date: meetingDate,
        time: meetingTime,
      })
      await RealtimeChatService.sendMessage({
        roomId: activeRoomId,
        senderId: user.uid,
        senderName: customUser?.name || "Student",
        senderPhoto: customUser?.photoURL || "",
        type: "system",
        text: `Requested a handover meeting at ${officeTitle} on ${meetingDate} at ${meetingTime}.`,
      })
      setShowMeetingScheduler(false)
      setMeetingDate("")
      setMeetingTime("")
      setMeetingOffice("")
    } catch (err) {
      console.error("Failed to schedule meeting:", err)
    } finally {
      setScheduling(false)
    }
  }

  // Voice Note Recorder
  const startRecording = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      alert("Microphone recording is not supported in this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        stream.getTracks().forEach((track) => track.stop())

        // Convert to data URL
        const reader = new FileReader()
        reader.onloadend = async () => {
          const audioUrl = reader.result as string
          if (activeRoomId && user) {
            await RealtimeChatService.sendMessage({
              roomId: activeRoomId,
              senderId: user.uid,
              senderName: customUser?.name || "Student",
              senderPhoto: customUser?.photoURL || "",
              type: "voice",
              audioUrl,
              audioDuration: recordingSeconds,
            })
          }
        }
        reader.readAsDataURL(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Microphone access denied or error:", err)
      alert(
        "Unable to access microphone. Please grant permissions in your browser.",
      )
    }
  }

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      audioChunksRef.current = []
      setIsRecording(false)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }

  // Play audio note
  const togglePlayAudio = (msgId: string, audioUrl: string) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause()
      setPlayingAudioId(null)
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
      }
      const audio = new Audio(audioUrl)
      audioPlayerRef.current = audio
      audio.play()
      setPlayingAudioId(msgId)
      audio.onended = () => setPlayingAudioId(null)
    }
  }

  // Share safe meeting location
  const handleShareLocation = async (spot: LocationAttachment) => {
    if (!activeRoomId || !user) return
    setShowLocationPicker(false)
    try {
      await RealtimeChatService.sendMessage({
        roomId: activeRoomId,
        senderId: user.uid,
        senderName: customUser?.name || "Student",
        senderPhoto: customUser?.photoURL || "",
        type: "location",
        locationData: spot,
      })
    } catch (err) {
      console.error("Failed to share location:", err)
    }
  }

  const filteredRooms = rooms.filter((r) => {
    const other = r.participants.find((p) => p !== user?.uid) || ""
    const name = r.participantNames?.[other] || ""
    const title = r.itemTitle || ""
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/dashboard" className="hover:text-emerald-600">
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">
            Real-time Chat & Handover
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] tracking-tight">
              Messages
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Secure campus chat with voice notes, photo attachments, and safe
              meeting spot coordination.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex h-[640px]">
        {/* Sidebar */}
        <div
          className={`w-full md:w-80 border-r border-gray-200 flex flex-col bg-white ${
            showMobileList ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Search bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs"
              />
            </div>
          </div>

          {/* Rooms list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2
                  size={24}
                  className="animate-spin text-emerald-600 mb-2"
                />
                <span className="text-xs text-gray-400">Loading chats...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <MessageSquare
                  size={32}
                  className="text-gray-300 mx-auto mb-2"
                />
                No messages yet. When an AI match is found, initiate chat
                directly here.
              </div>
            ) : (
              filteredRooms.map((room) => {
                const other =
                  room.participants.find((p) => p !== user?.uid) || ""
                const name = room.participantNames?.[other] || "Campus User"
                const photo = room.participantPhotos?.[other] || ""
                const unread = room.unreadCount?.[user?.uid || ""] || 0
                const isActive = room.id === activeRoomId

                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      setActiveRoomId(room.id)
                      setShowMobileList(false)
                    }}
                    className={`w-full text-left p-4 flex gap-3 transition-colors ${
                      isActive ? "bg-emerald-50/70" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          className="w-11 h-11 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="font-bold text-[#131b2e] text-sm truncate">
                          {name}
                        </h4>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {room.lastMessageTime
                            ? formatDateLabel(room.lastMessageTime)
                            : ""}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 truncate mb-1">
                        {room.lastMessage || room.itemTitle || "Start chatting"}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                          {room.itemTitle}
                        </span>
                        {unread > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col h-full bg-gray-50 ${
            !showMobileList ? "flex" : "hidden md:flex"
          }`}
        >
          {!activeRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-bold text-[#131b2e] text-base mb-1">
                Select a conversation
              </h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Choose a conversation on the left or connect with a finder from
                the AI Match page.
              </p>
            </div>
          ) : (
            <>
              {/* Active Room Top Bar */}
              <div className="p-3.5 px-5 border-b border-gray-200 bg-white flex justify-between items-center shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 -ml-2 text-gray-400 hover:text-gray-700"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>

                  <div className="relative">
                    {otherUserPhoto ? (
                      <img
                        src={otherUserPhoto}
                        alt={otherUserName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        {otherUserName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Live Online Badge */}
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        otherOnline ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-[#131b2e] text-sm flex items-center gap-2">
                      {otherUserName}
                    </h3>
                    <p
                      className={`text-[11px] font-medium ${
                        otherOnline
                          ? "text-emerald-600 font-bold"
                          : "text-gray-400"
                      }`}
                    >
                      {typingUsers.length > 0 ? (
                        <span className="text-emerald-600 animate-pulse">
                          Typing...
                        </span>
                      ) : otherOnline ? (
                        "Active Online"
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-full border border-purple-100">
                    {activeRoom.itemTitle}
                  </span>
                  <button
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-bold rounded-xl border border-blue-200"
                    title="Suggest a safe campus meeting point"
                  >
                    <MapPin size={13} />
                    <span className="hidden sm:inline">
                      Suggest Meeting Spot
                    </span>
                  </button>
                  <button
                    onClick={() => setShowMeetingScheduler(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-bold rounded-xl border border-emerald-200"
                    title="Schedule Handover Meeting"
                  >
                    <Calendar size={13} />
                    <span className="hidden sm:inline">
                      Schedule Meeting
                    </span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 transition"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        <button
                          onClick={handleBlockUser}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                        >
                          <Ban size={14} /> Block User
                        </button>
                        <button
                          onClick={handleReportConversation}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 text-left border-t border-gray-100"
                        >
                          <Flag size={14} /> Report Conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Picker Overlay Modal */}
              {showLocationPicker && (
                <div className="p-4 bg-white border-b border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <Shield size={14} className="text-blue-600" />
                      Select Verified Safe Campus Handover Spot
                    </div>
                    <button
                      onClick={() => setShowLocationPicker(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SAFE_CAMPUS_SPOTS.map((spot) => (
                      <button
                        key={spot.title}
                        onClick={() => handleShareLocation(spot)}
                        className="text-left p-2.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-start gap-2.5"
                      >
                        <Building2
                          size={16}
                          className="text-blue-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-[#131b2e]">
                            {spot.title}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {spot.address}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-xs text-gray-400 bg-white border border-gray-200 px-4 py-1.5 rounded-full shadow-xs">
                      Conversation started. Coordinate item handover safely.
                    </span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid
                    const isRead = msg.readBy?.length > 1

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl shadow-xs overflow-hidden ${
                            isMe
                              ? "bg-emerald-600 text-white rounded-tr-xs"
                              : "bg-white border border-gray-200 text-[#131b2e] rounded-tl-xs"
                          }`}
                        >
                          {/* Image Attachment */}
                          {msg.type === "image" && msg.imageUrl && (
                            <div
                              onClick={() =>
                                setPreviewImageModal(msg.imageUrl || null)
                              }
                              className="cursor-pointer group relative overflow-hidden bg-black/5"
                            >
                              <img
                                src={msg.imageUrl}
                                alt="Shared attachment"
                                className="max-h-64 w-full object-cover transition-transform group-hover:scale-102"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Voice Note Attachment */}
                          {msg.type === "voice" && msg.audioUrl && (
                            <div className="p-3 flex items-center gap-3 min-w-[200px]">
                              <button
                                onClick={() =>
                                  togglePlayAudio(msg.id, msg.audioUrl!)
                                }
                                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs transition-transform hover:scale-105 ${
                                  isMe
                                    ? "bg-white text-emerald-700"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause size={16} />
                                ) : (
                                  <Play size={16} className="ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="font-bold flex items-center gap-1">
                                    <Volume2 size={12} /> Voice Note
                                  </span>
                                  <span className="text-[10px] font-mono opacity-80">
                                    {msg.audioDuration
                                      ? `${msg.audioDuration}s`
                                      : "Audio"}
                                  </span>
                                </div>
                                <div
                                  className={`h-1.5 rounded-full overflow-hidden ${
                                    isMe ? "bg-white/30" : "bg-gray-200"
                                  }`}
                                >
                                  <div
                                    className={`h-full ${
                                      isMe ? "bg-white" : "bg-emerald-600"
                                    }`}
                                    style={{
                                      width:
                                        playingAudioId === msg.id
                                          ? "100%"
                                          : "0%",
                                      transition:
                                        playingAudioId === msg.id
                                          ? "width 5s linear"
                                          : "none",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Location Meeting Card */}
                          {msg.type === "location" && msg.locationData && (
                            <div
                              className={`p-3.5 min-w-[240px] ${
                                isMe
                                  ? "bg-emerald-700 text-white"
                                  : "bg-blue-50/70 border-b border-blue-100"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="p-1 rounded-md bg-white text-blue-600 shadow-xs">
                                  <MapPin size={14} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider">
                                  Meeting Location Suggested
                                </span>
                              </div>
                              <div className="text-sm font-bold mt-1">
                                {msg.locationData.title}
                              </div>
                              {msg.locationData.address && (
                                <div
                                  className={`text-xs mt-0.5 ${
                                    isMe ? "text-emerald-100" : "text-gray-600"
                                  }`}
                                >
                                  {msg.locationData.address}
                                </div>
                              )}
                              <a
                                href={`https://maps.google.com/?q=${msg.locationData.lat},${msg.locationData.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                                  isMe
                                    ? "bg-white text-emerald-800 hover:bg-emerald-50"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                <ExternalLink size={11} /> Open in Google Maps
                              </a>
                            </div>
                          )}

                          {/* Text message content */}
                            {msg.type === "pdf" && (
                              <a href={msg.pdfUrl} download={msg.pdfName} className="flex items-center gap-2 text-blue-100 hover:underline">
                                <FileText size={24} />
                                <span>{msg.pdfName}</span>
                              </a>
                            )}
                            {msg.text && (
                              <p className="text-[13px] leading-relaxed break-words mt-1">
                                {msg.text}
                              </p>
                            )}

                          {/* Timestamp and Read Status */}
                          <div
                            className={`px-3 pb-1.5 flex items-center gap-1 justify-end text-[10px] ${
                              isMe ? "text-emerald-100" : "text-gray-400"
                            }`}
                          >
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMe &&
                              (isRead ? (
                                <span title="Read">
                                  <CheckCheck
                                    size={13}
                                    className="text-emerald-200"
                                  />
                                </span>
                              ) : (
                                <span title="Sent">
                                  <Check size={13} className="opacity-75" />
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Animated Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 p-2.5 px-4 rounded-2xl rounded-tl-xs shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 font-medium">
                          typing
                        </span>
                        <div
                          className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Toolbar */}
              <div className="p-3.5 bg-white border-t border-gray-200">
                {isRecording ? (
                  /* Live Recording View */
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded-2xl border border-red-200">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-ping ml-2" />
                    <span className="text-xs font-bold text-red-700">
                      Recording Voice Note: {recordingSeconds}s
                    </span>
                    <div className="flex-1" />
                    <button
                      onClick={cancelRecording}
                      className="px-3 py-1 text-xs font-bold text-gray-600 hover:text-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={stopAndSendRecording}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                    >
                      <Square size={13} /> Send Voice Note
                    </button>
                  </div>
                ) : (
                  /* Standard Input Bar */
                  <div className="flex items-end gap-2">
                    {/* Image Attachment Button */}
                    <label
                      className={`p-2.5 text-gray-500 hover:text-emerald-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer flex-shrink-0 ${
                        uploadingImage ? "opacity-50" : ""
                      }`}
                      title="Attach Photo"
                    >
                      {uploadingImage ? (
                        <Loader2
                          size={18}
                          className="animate-spin text-emerald-600"
                        />
                      ) : (
                        <ImageIcon size={18} />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>

                    {/* PDF Attachment Button */}
                    <label
                      className={`p-2.5 text-gray-500 hover:text-emerald-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer flex-shrink-0 ${
                        uploadingPdf ? "opacity-50" : ""
                      }`}
                      title="Attach PDF"
                    >
                      {uploadingPdf ? (
                        <Loader2 size={18} className="animate-spin text-emerald-600" />
                      ) : (
                        <FileText size={18} />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        disabled={uploadingPdf}
                      />
                    </label>

                    {/* Voice Note Button */}
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 text-gray-500 hover:text-emerald-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl flex-shrink-0"
                      title="Record Voice Note"
                    >
                      <Mic size={18} />
                    </button>

                    {/* Text Input Area */}
                    <textarea
                      placeholder="Type a message or press Enter to send..."
                      rows={1}
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value)
                        handleTyping()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendText()
                        }
                      }}
                      className="flex-1 max-h-28 p-2.5 px-3.5 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs leading-relaxed resize-none transition-all"
                    />

                    {/* Emoji Button (Placeholder) */}
                    <button
                      type="button"
                      onClick={() => setMessageText((prev) => prev + "👍")}
                      className="p-2.5 text-gray-500 hover:text-emerald-600 transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl flex-shrink-0"
                      title="Add Emoji"
                    >
                      <Smile size={18} />
                    </button>

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={handleSendText}
                      disabled={!messageText.trim() || sending}
                      className="p-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs flex-shrink-0"
                    >
                      {sending ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Send size={17} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/90"
            >
              <X size={20} />
            </button>
            <img
              src={previewImageModal}
              alt="Fullscreen Preview"
              className="max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Meeting Scheduler Modal */}
      {showMeetingScheduler && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-[#131b2e] flex items-center gap-2">
                <Calendar className="text-emerald-600" size={18} />
                Schedule Handover Meeting
              </h3>
              <button
                onClick={() => setShowMeetingScheduler(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Campus Office</label>
                <select
                  value={meetingOffice}
                  onChange={(e) => setMeetingOffice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="">Choose an office...</option>
                  {SAFE_CAMPUS_SPOTS.filter(s => s.isCampusOffice).map((spot, i) => (
                    <option key={i} value={spot.address}>{spot.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleScheduleMeeting}
                  disabled={!meetingOffice || !meetingDate || !meetingTime || scheduling}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {scheduling ? <Loader2 size={18} className="animate-spin" /> : "Send Meeting Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
