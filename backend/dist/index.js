"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_js_1 = require("../src/generated/prisma/client.js");
dotenv_1.default.config();
const PORT = process.env.PORT || 8000;
const prisma = new client_js_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("Hello from Kalakriti backend!");
});
app.get("/users", async (_req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
