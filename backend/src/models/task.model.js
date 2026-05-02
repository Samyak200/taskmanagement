import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, "Task title is required"],
        trim: true
    },
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project', 
        required: true 
    },
    assignedTo: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    }],
    status: { 
        type: String, 
        enum: ['Todo', 'In-Progress', 'Done'], 
        default: 'Todo' 
    },
    deadline: { type: Date }
}, { timestamps: true });

const taskModel = mongoose.model("Task", taskSchema);
export default taskModel;