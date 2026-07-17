import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { 
  fetchComplaintById, 
  postInternalNote,
  closeTicket,
  acceptTicket
} from '../redux/slices/complaintSlice';
import { 
  ArrowLeft, 
  Calendar, 
  Hash, 
  Paperclip, 
  Send,  
  Clock, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  CheckCircle,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import { STATUS_COLORS, PRIORITY_COLORS, SOCKET_URL, API_URL } from '../constants';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const ComplaintDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socket = useSocket();

  const { selectedComplaint, isLoading } = useSelector((state) => state.complaints);
  const { user, token } = useSelector((state) => state.auth);

  // Chat Local states
  const [chatThread, setChatThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat logs
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Complaint details
  useEffect(() => {
    dispatch(fetchComplaintById(id));
  }, [dispatch, id]);

  // Load chat thread for this complaint
  useEffect(() => {
    if (!selectedComplaint || !selectedComplaint.assignedAgent) {
      setChatLoading(false);
      return;
    }

    const fetchChatThread = async () => {
      setChatLoading(true);
      try {
        const res = await axios.get(`${API_URL}/chats/complaint/${selectedComplaint._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const thread = res.data.chat;
        setChatThread(thread);

        // Fetch messages for thread
        const msgRes = await axios.get(`${API_URL}/chats/${thread._id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(msgRes.data.messages);
      } catch (err) {
        console.error('Chat initialization failure:', err);
      } finally {
        setChatLoading(false);
      }
    };
    fetchChatThread();
  }, [selectedComplaint, token]);

  // Socket Connection setup for this chat
  useEffect(() => {
    if (!socket || !chatThread) return;

    socket.emit('join_chat', chatThread._id);

    // Listen for new messages
    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Listen for typing events
    socket.on('typing_status', (data) => {
      if (data.chatId === chatThread._id) {
        setIsTyping(data.isTyping);
        setTypingUser(data.userName);
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('typing_status');
    };
  }, [socket, chatThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typing state emitter
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !chatThread) return;

    if (e.target.value.trim()) {
      socket.emit('typing', { chatId: chatThread._id, userName: user.name });
    } else {
      socket.emit('stop_typing', { chatId: chatThread._id });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !chatThread) return;

    socket.emit('send_message', {
      chatId: chatThread._id,
      senderId: user._id,
      messageText: newMessage
    });

    socket.emit('stop_typing', { chatId: chatThread._id });
    setNewMessage('');
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setNoteLoading(true);
    dispatch(postInternalNote({ id: selectedComplaint._id, note: noteText }))
      .unwrap()
      .then(() => {
        toast.success('Internal note added.');
        setNoteText('');
        dispatch(fetchComplaintById(id));
      })
      .catch((err) => toast.error(err))
      .finally(() => setNoteLoading(false));
  };

  const handleCloseComplaint = () => {
    dispatch(closeTicket(selectedComplaint._id))
      .unwrap()
      .then(() => {
        toast.success('Ticket closed successfully.');
        dispatch(fetchComplaintById(id));
      })
      .catch((err) => toast.error(err));
  };

  const handleAcceptAssignment = () => {
    dispatch(acceptTicket(selectedComplaint._id))
      .unwrap()
      .then(() => {
        toast.success('Accepted ticket assignment.');
        dispatch(fetchComplaintById(id));
      })
      .catch((err) => toast.error(err));
  };

  if (isLoading || !selectedComplaint) {
    return <div className="text-center py-12 text-slate-400">Loading complaint details...</div>;
  }

  const isAgent = user.role === 'Agent';
  const isAdmin = user.role === 'Admin';
  const isCustomer = user.role === 'Customer';

  return (
    <div className="space-y-6">
      
      {/* Header toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <div className="flex gap-2">
          {isCustomer && selectedComplaint.status === 'Resolved' && (
            <button
              onClick={handleCloseComplaint}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow active:scale-95 transition-all"
            >
              Verify & Close Complaint
            </button>
          )}

          {isAgent && selectedComplaint.status === 'Assigned' && (
            <button
              onClick={handleAcceptAssignment}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow active:scale-95 transition-all"
            >
              Accept Assignment
            </button>
          )}
        </div>
      </div>

      {/* Main split work space */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Ticket Metadata & Timelines (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 text-left">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-primary-500 text-sm flex items-center"><Hash size={14} />{selectedComplaint.ticketId}</span>
                <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${STATUS_COLORS[selectedComplaint.status]}`}>{selectedComplaint.status}</span>
                <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${PRIORITY_COLORS[selectedComplaint.priority]}`}>{selectedComplaint.priority}</span>
              </div>
              <h2 className="text-xl font-bold mt-3 leading-snug">{selectedComplaint.title}</h2>
              <div className="flex items-center gap-4 text-[11px] text-slate-450 mt-1.5 font-medium">
                <span className="flex items-center gap-0.5"><Calendar size={12} /> Raised: {new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                <span>Category: <strong className="text-slate-655 dark:text-slate-350">{selectedComplaint.category?.name || 'Unassigned'}</strong></span>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <h4 className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Complaint Details</h4>
              <p className="text-xs mt-2 text-slate-655 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedComplaint.description}</p>
            </div>

            {/* Attachments Section */}
            {selectedComplaint.attachments?.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <h4 className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Submitted Attachments</h4>
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {selectedComplaint.attachments.map((file, i) => (
                    <a
                      key={i}
                      href={`${SOCKET_URL}${file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold"
                    >
                      <Paperclip size={12} /> attachment_{i+1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Details */}
            {selectedComplaint.resolutionDescription && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 bg-emerald-50/20 dark:bg-emerald-950/5 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
                <h4 className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle size={12} /> Official Resolution Details
                </h4>
                <p className="text-xs mt-2 text-slate-655 dark:text-slate-300 leading-relaxed">{selectedComplaint.resolutionDescription}</p>
                {selectedComplaint.resolutionAttachments?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedComplaint.resolutionAttachments.map((file, i) => (
                      <a
                        key={i}
                        href={`${SOCKET_URL}${file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100/40 rounded-lg text-[10px] font-semibold"
                      >
                        <FileText size={10} /> resolution_file_{i+1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Internal Notes log section */}
          {(!isCustomer) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-left">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-primary-500" /> Private Internal Annotations
              </h3>
              
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {selectedComplaint.internalNotes?.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No private agent notes recorded.</p>
                ) : (
                  selectedComplaint.internalNotes.map((note, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-2xl">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span>by Agent: {note.author?.name || 'Agent'}</span>
                        <span>{new Date(note.date).toLocaleString()}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{note.note}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2 border-t pt-3">
                <input
                  type="text"
                  placeholder="Record private details visible only to support staff..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={noteLoading || !noteText.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow disabled:opacity-50"
                >
                  Save Note
                </button>
              </form>
            </div>
          )}

          {/* Timelines View */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-1.5"><Clock size={16} className="text-primary-500" /> Ticket Timeline Log</h3>
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-5 space-y-6">
              {selectedComplaint.timeline?.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[27.5px] top-0.5 bg-white dark:bg-slate-900 h-3.5 w-3.5 rounded-full border-2 border-primary-500 flex items-center justify-center"></div>
                  <div>
                    <span className="font-bold text-xs leading-none">{step.status}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(step.date).toLocaleString()}</span>
                    {step.statusChangeReason && (
                      <p className="text-xs text-slate-500 mt-1 italic font-medium leading-relaxed">"{step.statusChangeReason}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Communication Chat Threads */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[500px] lg:h-[600px] text-left">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-500" />
              <span className="font-bold text-xs">Real-Time Chat Thread</span>
            </div>
            {selectedComplaint.assignedAgent ? (
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 rounded-full text-[9px] font-bold">Online Session</span>
            ) : (
              <span className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-550 rounded-full text-[9px] font-semibold">Tethering Pending</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {!selectedComplaint.assignedAgent ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <MessageSquare className="stroke-current opacity-40" size={32} />
                <p className="text-xs">Chat will become available once an agent accepts the complaint task.</p>
              </div>
            ) : chatLoading ? (
              <div className="text-xs text-center text-slate-400 py-6">Connecting thread channels...</div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No chat messages exchanged yet. Send a greeting to start.
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                return (
                  <div key={msg._id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-400 mb-0.5 px-1">{isMe ? 'You' : msg.sender?.name || 'Agent'}</span>
                    <div className={`p-3 max-w-[85%] rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                      <p>{msg.messageText}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {isTyping && (
            <div className="px-4 py-1 text-[10px] text-slate-400 italic">
              {typingUser} is typing...
            </div>
          )}

          {selectedComplaint.assignedAgent && (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Write a message..."
                value={newMessage}
                onChange={handleTyping}
                disabled={selectedComplaint.status === 'Closed'}
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || selectedComplaint.status === 'Closed'}
                className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};

export default ComplaintDetails;
