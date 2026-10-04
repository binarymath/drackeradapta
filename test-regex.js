const regex = /\[img(?:=([0-9%px]+)(?:x([0-9%px]+))?)?\](.*?)\[\/img\]|\[IMG(?:=([0-9%px]+)(?:x([0-9%px]+))?)?\]/gi;
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
        console.log("Matched:", match[0]);
        console.log("Full block match:", match[1], match[2], match[3]);
        console.log("Inline block match:", match[4], match[5]);
    }
}
