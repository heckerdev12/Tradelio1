import { useState } from "react";
import { FaCamera } from "react-icons/fa";

// ----- MODAL COMPONENT -----
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-lg w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ----- PROFILE PAGE -----
function ProfilePage() {
  const [user, setUser] = useState({
    fullName: "John Doe",
    profilePic: "https://via.placeholder.com/150",
    totalTrades: 120,
    profitLoss: 450.75,
  });

  const [isPicModalOpen, setIsPicModalOpen] = useState(false);
  const [tempPic, setTempPic] = useState("");

  const handlePicSave = () => {
    if (tempPic) {
      setUser({ ...user, profilePic: tempPic });
      setTempPic("");
      setIsPicModalOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-8">Profile</h2>

      <div className="grid md:grid-cols-2 gap-12">
        {/* PROFILE INFO */}
        <div className="bg-zinc-800 p-6 rounded-lg shadow-md flex flex-col items-center">
          <div className="relative">
            <img
              src={user.profilePic}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover"
            />
            <button
              onClick={() => setIsPicModalOpen(true)}
              className="absolute bottom-0 right-0 bg-zinc-700 p-2 rounded-full hover:bg-zinc-600"
            >
              <FaCamera className="text-white" />
            </button>
          </div>
          <h3 className="text-xl font-semibold text-white mt-4">{user.fullName}</h3>
        </div>

        {/* ACTIVITY SUMMARY */}
        <div className="bg-zinc-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-white mb-4">Activity Summary</h3>
          <div className="space-y-3 text-white">
            <p>
              Total Trades: <span className="font-bold">{user.totalTrades}</span>
            </p>
            <p>
              Profit / Loss: <span className="font-bold">{user.profitLoss} USD</span>
            </p>
          </div>
        </div>
      </div>

      {/* PROFILE PICTURE MODAL */}
      <Modal isOpen={isPicModalOpen} onClose={() => setIsPicModalOpen(false)}>
        <h3 className="text-lg font-semibold mb-4">Update Profile Picture</h3>
        <input
          type="text"
          placeholder="Enter image URL"
          value={tempPic}
          onChange={(e) => setTempPic(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg w-full mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsPicModalOpen(false)}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handlePicSave}
            className="px-4 py-2 rounded-lg bg-green-500 text-black hover:bg-green-600"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ProfilePage;
