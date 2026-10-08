const regex = /\[img(?:=([a-zA-Z0-9%]+))?\](.*?)\[\/img\]|\[IMG(?:=([a-zA-Z0-9%]+))?\]/gi;
const texts = [
    "[IMG]",
    "[IMG=300]",
    "[IMG=300x200]",
    "[img]URL[/img]",
    "[img=300]URL[/img]",
    "[img=300x200]URL[/img]",
    "Hello [IMG=50%] world",
    "Teste [img=200px]abc[/img]"
];

for (const t of texts) {
    let match;
    while ((match = regex.exec(t)) !== null) {
        let sizeStr = match[1] || match[3];
        let url = match[2];
        let isStandalone = match[0].toUpperCase().startsWith('[IMG');
        if (match[0].toLowerCase().includes('[/img]')) isStandalone = false;
        
        console.log("Matched:", match[0], "Size:", sizeStr, "URL:", url, "isStandalone:", isStandalone);
    }
}
