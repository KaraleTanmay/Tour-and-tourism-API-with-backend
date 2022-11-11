const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: "./configure.env" });

process.on("uncaughtException", (err) => {
    console.log("uncaught exception.. shutting down");
    console.log("error", err);
    process.exit(1);
})

const app = require('./app');

mongoose.connect(process.env.DATABASE_CONNECTION, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("db connected");
}).catch((err) => {
    console.log("bd not connected" + err);
})


const port = process.env.port;
const server = app.listen(port, () => {
    console.log("server has been started\nlistening port 3000...");
})

process.on("unhandledRejection", (err) => {
    console.log("unhandled rejection.. shutting down");
    console.log("error", err.name, err.message);
    server.close(() => {
        process.exit(1);
    })
})

// mongo password
// eoLpGSGXcQ6XbCjb
//5e57IcfTygIoazMa
//anyname
//SPFShs8a6wfttPlU