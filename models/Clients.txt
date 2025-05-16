import mongoose from "mongoose";

let clientSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  cart: {
    type: Array,
    required: true,
  },
  wishlist: {
    type: Array,
    required: true,
  },
});

// let clientModel = mongoose.model("Client", clientSchema);

let clientModel =
  mongoose.models.Client || mongoose.model("Client", clientSchema);

export default clientModel;
