export default function MemberDashboard() {
    const tasks = [
      { id: 1, title: "UI DESIGN", project: "Mobile App Redesign", status: "IN-PROGRESS", color: "bg-amber-400" },
      { id: 2, title: "API INTEGRATION", project: "E-commerce Website", status: "TODO", color: "bg-red-500" },
      { id: 3, title: "DATABASE SETUP", project: "Mobile App Redesign", status: "DONE", color: "bg-green-500" }
    ];
  
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Header */}
        <header className="bg-white border-b p-4 flex justify-between items-center px-12">
          <h1 className="text-xl font-bold text-teal-800">T-Manager</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">As seen by <b className="text-teal-700">Mike R.</b></span>
            <div className="w-8 h-8 bg-teal-200 rounded-full"></div>
          </div>
        </header>
  
        <main className="p-12">
          <h2 className="text-3xl font-bold mb-8">MY TASKS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white border p-6 rounded-2xl shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-bold">{task.title}</h3>
                <p className="text-gray-400 text-sm mb-4">({task.project})</p>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">STATUS</label>
                  <select className={`w-full ${task.color} text-white font-bold py-2 px-3 rounded-lg appearance-none cursor-pointer border-none focus:ring-0`}>
                    <option>TODO</option>
                    <option selected={task.status === "IN-PROGRESS"}>IN-PROGRESS</option>
                    <option selected={task.status === "DONE"}>DONE</option>
                  </select>
                </div>
  
                {/* Mini Team Preview (Mock avatars) */}
                <div className="flex -space-x-2 mt-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-300"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }