export default function AdminDashboard() {
    const members = ["Sarah J.", "Mike R.", "David K.", "Aisha B."]; // API se aayenge
  
    return (
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar - Simple Navigation */}
        <div className="w-64 bg-teal-800 text-white p-6 space-y-6">
          <h1 className="text-2xl font-bold italic">T-Manager</h1>
          <nav className="space-y-4">
            <div className="bg-teal-700 p-2 rounded cursor-pointer">Projects</div>
            <div className="hover:bg-teal-700 p-2 rounded cursor-pointer">Teams</div>
          </nav>
        </div>
  
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Project: Mobile App Redesign</h2>
            <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">+ CREATE NEW TASK</button>
          </div>
  
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Projects List */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold mb-4 text-gray-600">ACTIVE PROJECTS</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-400">
                    <th className="pb-2">Project Name</th>
                    <th className="pb-2">Members</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b">
                    <td className="py-4">Mobile App Redesign</td>
                    <td>4</td>
                    <td className="text-green-500 font-medium">On Track</td>
                    <td className="text-teal-600 cursor-pointer">View Details</td>
                  </tr>
                </tbody>
              </table>
            </div>
  
            {/* Quick Task Creation Form (Mini-Team Logic) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-bold mb-4">CREATE NEW TASK</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Task Title</label>
                  <input type="text" className="w-full border rounded p-2 mt-1" placeholder="Implement Login" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Assign To (Multi-select)</label>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 mt-1 space-y-2 text-sm">
                    {members.map((m) => (
                      <label key={m} className="flex items-center space-x-2">
                        <input type="checkbox" className="accent-teal-600" /> <span>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button className="w-full bg-teal-600 text-white py-2 rounded-lg mt-2">Create & Assign</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }