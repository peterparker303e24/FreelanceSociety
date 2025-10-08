import express from "express";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;

const inputArguments = process.argv;
const __dirname = dirname(fileURLToPath(import.meta.url));

let isLocalBlockchain = false;
if (inputArguments.includes("--local-blockchain")) {
    isLocalBlockchain = true;
}

app.use(cookieParser());

app.use(express.static(__dirname, {
    setHeaders: function (res, path, stat) {
        res.set('Set-Cookie', `isLocalBlockchain=${isLocalBlockchain};Path=/;SameSite=Strict`)
    }
}));

app.use((req, res) => {
    res.status(404).sendFile(`${__dirname}/pages/404.html`);
});

app.listen(PORT, () => {
    console.log(`Server running ap http://localhost:${PORT}`);
});
