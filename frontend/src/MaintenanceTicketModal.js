// src/MaintenanceTicketModal.js
import React from 'react';
import { useTickets } from './TicketContext'; // Import the useTickets hook

const MaintenanceTicketModal = ({ machineId, details, onClose }) => {
  const { addTicket } = useTickets(); // Get the addTicket function from context

  const handleSubmit = () => {
    // Add the new ticket to our global store
    addTicket({ machineId, details }); 

    alert(`✅ Maintenance ticket for ${machineId} has been successfully created!`);
    onClose();
  };

  // ... The rest of your modal's JSX remains exactly the same
  
};

export default MaintenanceTicketModal;