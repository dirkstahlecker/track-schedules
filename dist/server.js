"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const ocr_1 = require("./ocr");
const app = express_1.default();
function ocr() {
    return __awaiter(this, void 0, void 0, function* () {
        const text = yield ocr_1.Scraper.executeOCR('https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg');
        const dates = ocr_1.Scraper.guessDatesFromString(text);
    });
}
ocr();
// doScraping();
app.get("/test", (req, res) => {
    console.log("/test");
    res.json({ message: "Hello World" });
});
// // The "catchall" handler: for any request that doesn't
// // match one above, send back React's index.html file.
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname+'/client/build/index.html'));
//   });
// Don't touch the following - Heroku gets very finnicky about it
// Serve static files from the React app
app.use(express_1.default.static(path_1.default.join(__dirname, 'client/build')));
const root = path_1.default.join(__dirname, '..', 'client', 'build');
app.use(express_1.default.static(root));
app.get("*", (req, res) => {
    res.sendFile('index.html', { root });
});
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`server started on port ${port}`);
});
//# sourceMappingURL=server.js.map