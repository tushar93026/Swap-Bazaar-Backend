import mongoose, {Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const productSchema = new Schema(
    {
        title:{
            type: String,
            required: true,
        },
        description:{
            type: String,
            required: true,
        },
        price:{
            type: Number,
            required: true,
        },
        images: [{type: String}],
        seller: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        category: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category', 
            required: true 
          },
        isSold: {
            type: Boolean,
            default: false
        }

    },{timestamps: true}
)


productSchema.plugin(mongooseAggregatePaginate)

export const Product = mongoose.model("Product", productSchema)