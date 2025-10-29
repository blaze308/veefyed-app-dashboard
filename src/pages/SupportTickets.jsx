import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ticketService from "../services/ticketService";
import userService from "../services/userService";
import { SupportTicket, TICKET_STATUS, TICKET_PRIORITY } from "../models/SupportTicket";

const SupportTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Staff lists
  const [supportStaff, setSupportStaff] = useState([]);
  const [developers, setDevelopers] = useState([]);
  
  // UI states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [newNote, setNewNote] = useState("");
  
  // Stats
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, supportData, devData, statsData] = await Promise.all([
        ticketService.getAllTickets(),
        userService.getSupportStaff(),
        userService.getDevelopers(),
        ticketService.getTicketStats(),
      ]);
      
      setTickets(ticketsData);
      setSupportStaff(supportData);
      setDevelopers(devData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = async (ticketId) => {
    if (!user?.uid) {
      alert("User not authenticated");
      return;
    }

    try {
      await ticketService.assignTicket(
        ticketId,
        user.uid,
        user.preferredName || user.displayName || user.email || "Unknown"
      );
      await loadData();
      if (selectedTicket?.id === ticketId) {
        const updated = await ticketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error("Error assigning ticket:", error);
      alert("Failed to assign ticket");
    }
  };

  const handleAssignToStaff = async (ticketId, staffId, staffName) => {
    try {
      await ticketService.assignTicket(ticketId, staffId, staffName);
      await loadData();
      setShowAssignModal(false);
      if (selectedTicket?.id === ticketId) {
        const updated = await ticketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error("Error assigning ticket:", error);
      alert("Failed to assign ticket");
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket || !escalationReason.trim()) {
      alert("Please provide an escalation reason");
      return;
    }

    try {
      // Find Jaime (developer) - you can hardcode or select from developers
      const jaime = developers.find(dev => 
        dev.email?.toLowerCase().includes("jaime") || 
        dev.fullName?.toLowerCase().includes("jaime")
      ) || developers[0]; // Fallback to first developer

      if (!jaime) {
        alert("No developer found to escalate to");
        return;
      }

      await ticketService.escalateTicket(
        selectedTicket.id,
        jaime.uid,
        jaime.fullName || jaime.displayName || jaime.email,
        escalationReason
      );
      
      await loadData();
      const updated = await ticketService.getTicketById(selectedTicket.id);
      setSelectedTicket(updated);
      setShowEscalateModal(false);
      setEscalationReason("");
    } catch (error) {
      console.error("Error escalating ticket:", error);
      alert("Failed to escalate ticket");
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await ticketService.updateTicketStatus(ticketId, newStatus);
      await loadData();
      if (selectedTicket?.id === ticketId) {
        const updated = await ticketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      await ticketService.updateTicketPriority(ticketId, newPriority);
      await loadData();
      if (selectedTicket?.id === ticketId) {
        const updated = await ticketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error("Error updating priority:", error);
      alert("Failed to update priority");
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicket || !newNote.trim()) return;

    if (!user?.uid) {
      alert("User not authenticated");
      return;
    }

    try {
      await ticketService.addInternalNote(
        selectedTicket.id,
        user.uid,
        user.preferredName || user.displayName || user.email || "Unknown",
        newNote
      );
      
      const updated = await ticketService.getTicketById(selectedTicket.id);
      setSelectedTicket(updated);
      setNewNote("");
      setShowNotesModal(false);
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    }
  };

  const handleRecordResponse = async (ticketId) => {
    try {
      await ticketService.recordResponse(ticketId);
      await loadData();
      if (selectedTicket?.id === ticketId) {
        const updated = await ticketService.getTicketById(ticketId);
        setSelectedTicket(updated);
      }
    } catch (error) {
      console.error("Error recording response:", error);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Filter by status
    if (filter === "my_tickets") {
      if (ticket.assignedTo !== user?.uid && ticket.escalatedTo !== user?.uid) {
        return false;
      }
    } else if (filter !== "all" && ticket.status !== filter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ticket.email.toLowerCase().includes(search) ||
        ticket.fullName.toLowerCase().includes(search) ||
        ticket.description.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-indigo-100 text-indigo-800";
      case "escalated":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "normal":
        return "bg-blue-500 text-white";
      case "low":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getIssueTypeColor = (issueType) => {
    switch (issueType) {
      case "Technical Issue":
        return "bg-red-100 text-red-800";
      case "Account Problem":
        return "bg-orange-100 text-orange-800";
      case "Payment Issue":
        return "bg-purple-100 text-purple-800";
      case "Feature Request":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600 mt-2">Layered support system - Support staff handle tickets, escalate serious issues to developers</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-800">{stats.assigned}</div>
            <div className="text-sm text-blue-700">Assigned</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-800">{stats.escalated}</div>
            <div className="text-sm text-red-700">Escalated</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-800">{stats.resolved}</div>
            <div className="text-sm text-green-700">Resolved</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-800">{stats.overdue}</div>
            <div className="text-sm text-orange-700">Overdue</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by email, name, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
            filter === "all"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({tickets.length})
        </button>
        <button
          onClick={() => setFilter("my_tickets")}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
            filter === "my_tickets"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Tickets ({tickets.filter(t => t.assignedTo === user?.uid || t.escalatedTo === user?.uid).length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
            filter === "pending"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending ({tickets.filter((t) => t.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("assigned")}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
            filter === "assigned"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Assigned ({tickets.filter((t) => t.status === "assigned").length})
        </button>
        <button
          onClick={() => setFilter("escalated")}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
            filter === "escalated"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Escalated ({tickets.filter((t) => t.status === "escalated").length})
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`pb-3 px-4 font-medium transition-colors whitespace-nowrap ${
            filter === "resolved"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Resolved ({tickets.filter((t) => t.status === "resolved").length})
        </button>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedTicket?.id === ticket.id
                    ? "border-black shadow-md"
                    : "border-gray-200"
                } ${ticket.isOverdue ? "border-l-4 border-l-orange-500" : ""}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {ticket.fullName}
                    </h3>
                    <p className="text-sm text-gray-600">{ticket.email}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mb-2 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getIssueTypeColor(
                      ticket.issueType
                    )}`}
                  >
                    {ticket.issueType}
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                    {ticket.accountType}
                  </span>
                </div>

                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                  {ticket.description}
                </p>

                {/* Assignment Info */}
                {ticket.assignedToName && (
                  <div className="text-xs text-blue-600 mb-1">
                    📋 Assigned to: {ticket.assignedToName}
                  </div>
                )}
                {ticket.escalatedToName && (
                  <div className="text-xs text-red-600 mb-1">
                    ⚠️ Escalated to: {ticket.escalatedToName}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{ticket.deviceType}</span>
                  <span>
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>

                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span>{ticket.attachments.length} attachment(s)</span>
                  </div>
                )}

                {ticket.internalNotes && ticket.internalNotes.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    <span>{ticket.internalNotes.length} internal note(s)</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Ticket Details Panel */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          {selectedTicket ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Ticket Details
                </h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="mb-6 flex flex-wrap gap-2">
                {!selectedTicket.assignedTo && user?.isSupport && (
                  <button
                    onClick={() => handleAssignToMe(selectedTicket.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Assign to Me
                  </button>
                )}
                {user?.isSupport && !selectedTicket.isEscalated && (
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                  >
                    Escalate to Developer
                  </button>
                )}
                <button
                  onClick={() => setShowNotesModal(true)}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                >
                  Add Internal Note
                </button>
                {user?.isSuperAdmin && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                  >
                    Reassign
                  </button>
                )}
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) =>
                      handleStatusChange(selectedTicket.id, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) =>
                      handlePriorityChange(selectedTicket.id, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Assignment Info */}
              {(selectedTicket.assignedToName || selectedTicket.escalatedToName) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Assignment Info
                  </h3>
                  {selectedTicket.assignedToName && (
                    <div className="text-sm mb-1">
                      <span className="text-gray-600">Assigned to:</span>{" "}
                      <span className="font-medium">{selectedTicket.assignedToName}</span>
                      {selectedTicket.assignedAt && (
                        <span className="text-gray-500 ml-2">
                          ({new Date(selectedTicket.assignedAt).toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                  {selectedTicket.escalatedToName && (
                    <div className="text-sm">
                      <span className="text-red-600">⚠️ Escalated to:</span>{" "}
                      <span className="font-medium">{selectedTicket.escalatedToName}</span>
                      {selectedTicket.escalatedAt && (
                        <span className="text-gray-500 ml-2">
                          ({new Date(selectedTicket.escalatedAt).toLocaleString()})
                        </span>
                      )}
                      {selectedTicket.escalationReason && (
                        <div className="mt-2 text-sm text-gray-700 italic">
                          Reason: {selectedTicket.escalationReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>{" "}
                    <span className="font-medium">{selectedTicket.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>{" "}
                    <a
                      href={`mailto:${selectedTicket.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedTicket.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-600">Account Type:</span>{" "}
                    <span className="font-medium">
                      {selectedTicket.accountType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Device:</span>{" "}
                    <span className="font-medium">{selectedTicket.deviceType}</span>
                  </div>
                  {selectedTicket.appVersion && (
                    <div>
                      <span className="text-gray-600">App Version:</span>{" "}
                      <span className="font-medium">
                        {selectedTicket.appVersion}
                      </span>
                    </div>
                  )}
                  {selectedTicket.dateTime && (
                    <div>
                      <span className="text-gray-600">Issue Date/Time:</span>{" "}
                      <span className="font-medium">{selectedTicket.dateTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Issue Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Issue Details
                </h3>
                <div className="space-y-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Issue Type:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getIssueTypeColor(
                        selectedTicket.issueType
                      )}`}
                    >
                      {selectedTicket.issueType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>{" "}
                    <span className="font-medium">
                      {selectedTicket.createdAt
                        ? new Date(selectedTicket.createdAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Internal Notes */}
              {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Internal Notes ({selectedTicket.internalNotes.length})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedTicket.internalNotes.map((note, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-purple-900">
                            {note.authorName}
                          </span>
                          <span className="text-xs text-purple-600">
                            {note.timestamp
                              ? new Date(note.timestamp).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{note.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTicket.attachments &&
                selectedTicket.attachments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Attachments ({selectedTicket.attachments.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedTicket.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-5 h-5 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="text-sm text-gray-700 flex-1">
                            {attachment.name}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={`mailto:${selectedTicket.email}?subject=Re: Support Ticket - ${selectedTicket.issueType}`}
                  onClick={() => handleRecordResponse(selectedTicket.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
                >
                  Reply via Email
                </a>
                {!selectedTicket.isResolved && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm("Mark this ticket as resolved?")
                      ) {
                        handleStatusChange(selectedTicket.id, "resolved");
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-gray-600">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Escalate to Developer</h3>
            <p className="text-sm text-gray-600 mb-4">
              This ticket will be escalated to the developer team. Please provide a reason for escalation.
            </p>
            <textarea
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Reason for escalation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEscalateModal(false);
                  setEscalationReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Add Internal Note</h3>
            <p className="text-sm text-gray-600 mb-4">
              Internal notes are only visible to support staff and developers.
            </p>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add your note here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setNewNote("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Assign Ticket</h3>
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-gray-700">Support Staff</h4>
              {supportStaff.map((staff) => (
                <button
                  key={staff.uid}
                  onClick={() =>
                    handleAssignToStaff(
                      selectedTicket.id,
                      staff.uid,
                      staff.fullName || staff.displayName || staff.email
                    )
                  }
                  className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {staff.fullName || staff.displayName || staff.email}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAssignModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
