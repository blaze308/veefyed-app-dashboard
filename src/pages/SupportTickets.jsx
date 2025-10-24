import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, resolved

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsRef = collection(db, "support_tickets");
      const q = query(ticketsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const ticketsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      
      setTickets(ticketsData);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const ticketRef = doc(db, "support_tickets", ticketId);
      await updateDoc(ticketRef, {
        status,
        updatedAt: new Date(),
      });
      
      // Update local state
      setTickets(tickets.map(t => 
        t.id === ticketId ? { ...t, status } : t
      ));
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === "all") return true;
    return ticket.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (issueType) => {
    switch (issueType) {
      case "Technical Issue":
        return "bg-red-100 text-red-800";
      case "Account Problem":
        return "bg-orange-100 text-orange-800";
      case "Payment Issue":
        return "bg-purple-100 text-purple-800";
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
        <p className="text-gray-600 mt-2">Manage customer support requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`pb-3 px-4 font-medium transition-colors ${
            filter === "all"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`pb-3 px-4 font-medium transition-colors ${
            filter === "pending"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending ({tickets.filter(t => t.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("in_progress")}
          className={`pb-3 px-4 font-medium transition-colors ${
            filter === "in_progress"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          In Progress ({tickets.filter(t => t.status === "in_progress").length})
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`pb-3 px-4 font-medium transition-colors ${
            filter === "resolved"
              ? "border-b-2 border-black text-black"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Resolved ({tickets.filter(t => t.status === "resolved").length})
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
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {ticket.fullName}
                    </h3>
                    <p className="text-sm text-gray-600">{ticket.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      ticket.status
                    )}`}
                  >
                    {ticket.status || "pending"}
                  </span>
                </div>

                <div className="flex gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
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
              </div>
            ))
          )}
        </div>

        {/* Ticket Details */}
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

              {/* Status Update */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedTicket.status || "pending"}
                  onChange={(e) =>
                    updateTicketStatus(selectedTicket.id, e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

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
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
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
                  className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-center"
                >
                  Reply via Email
                </a>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Mark this ticket as resolved?"
                      )
                    ) {
                      updateTicketStatus(selectedTicket.id, "resolved");
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Mark Resolved
                </button>
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
              <p className="text-gray-600">
                Select a ticket to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;

