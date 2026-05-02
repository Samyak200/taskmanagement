import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Project name is required"],
        trim: true 
    },
    description: { 
        type: String,
        default: "" // Optional rakha hai taaki mandatory na ho
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

const projectModel = mongoose.model("Project", projectSchema);
export default projectModel;