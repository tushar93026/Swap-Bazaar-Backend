import mongoose, { Schema } from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const chatSchema = new Schema(
    {
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],

        messages: [
            {
              sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
              content: { type: String, required: true },
              createdAt: { type: Date, default: Date.now },
            },
          ],
        
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

    },{timestamps: true})


 
chatSchema.plugin(mongooseAggregatePaginate)

export const Chat = mongoose.model("Chat", chatSchema)
