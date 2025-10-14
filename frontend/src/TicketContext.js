// src/TicketContext.js
import React, { createContext, useState, useContext } from 'react';

const TicketContext = createContext();

export const useTickets = () => useContext(TicketContext);

// This component will wrap our entire app, providing ticket data to all children
export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([
    // Start with some dummy data to make the admin panel look populated
    { id: 1, machineId: 'PMP-003', details: "AI detected 'Caution' status. Vibration levels are higher than normal.", status: 'Open', date: new Date().toLocaleDateString() },
  ]);

  const addTicket = (ticket) => {
    const newTicket = { ...ticket, id: tickets.length + 1, status: 'Open', date: new Date().toLocaleDateString() };
    setTickets(prevTickets => [newTicket, ...prevTickets]);
  };

  return (
    <TicketContext.Provider value={{ tickets, addTicket }}>
      {children}
    </TicketContext.Provider>
  );
};