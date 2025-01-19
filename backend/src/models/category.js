// import mongoose from 'mongoose'
// import Category from './category.model.js'

// mongoose.connect('mongodb://localhost:27017/your_database', { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(async () => {
//     console.log('Database connected');

//     // Define your categories
//     const categories = [
//       { name: 'Books', description: 'All kinds of books' },
//       { name: 'Electronics', description: 'Gadgets and devices' },
//       { name: 'Furniture', description: 'Chairs, tables, and more' },
//     ];

//     // Insert categories into the database
//     await Category.insertMany(categories);
//     console.log('Categories seeded');

//     mongoose.connection.close();
//   })
//   .catch(err => {
//     console.error('Database connection error:', err);
//   });
