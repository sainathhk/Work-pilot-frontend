import React, { useState } from "react";
import API from "../api/axiosConfig";

const RevisionPanel = ({ task, employees, assignerId, onSuccess, onClose }) => {
  const user = JSON.parse(localStorage.getItem("user")) || {} ;

const isAssigner = user?._id === assignerId;
const isDoer = user?._id === task?.doerId;

  const [newDeadline, setNewDeadline] = useState("");
  const [remarks, setRemarks] = useState("");
  const [newDoerId, setNewDoerId] = useState("");

  const handleSubmit = async (actionType) => {
    try {
      await API.post("/tasks/handle-revision", {
        taskId: task._id,
        action: actionType,
        newDeadline,
        newDoerId,
        remarks,
        assignerId
      });

      alert(`${actionType} Success`);
      onSuccess(); // refresh tasks
      onClose();   // close modal
    } catch (err) {
      console.error(err);
      alert("Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">

        <h2 className="font-bold text-lg">Revision Panel</h2>

        {/* DOER FLOW */}
        {isDoer && (
          <>
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <textarea
              placeholder="Reason for revision"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <button
              onClick={() => handleSubmit("Request")}
              className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
            >
              Request Revision
            </button>
          </>
        )}

        {/* ASSIGNER FLOW */}
        {isAssigner && (
          <>
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <select
              onChange={(e) => setNewDoerId(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Select New Doer</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit("Approve")}
                className="bg-green-500 text-white px-4 py-2 rounded w-full"
              >
                Approve
              </button>

              <button
                onClick={() => handleSubmit("Reassign")}
                className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              >
                Reassign
              </button>
            </div>
          </>
        )}

        <button onClick={onClose} className="text-red-500 w-full">
          Close
        </button>

      </div>
    </div>
  );
};

export default RevisionPanel;