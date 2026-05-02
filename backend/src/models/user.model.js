import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['admin', 'member'], 
        default: 'member' 
    }
}, { timestamps: true });

userSchema.set('toJSON', {
    transform(_, ret) {
        delete ret.password;
        return ret;
    },
});

const userModel = mongoose.model("User", userSchema);

export default userModel;