export class SvgAvatar {

    static getAvatar = (generator, data) => {

        const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg1.setAttribute("width", "200");
        svg1.setAttribute("height", "200");

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', '200');
        rect.setAttribute('height', '200');
        rect.setAttribute('fill', SvgAvatar.stringToColour(generator));
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', '50%');
        text.setAttribute('y', '54%');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '120');
        text.setAttribute('font-family', "'Inter', sans-serif");
        text.setAttribute('font-wight', "600");
        text.textContent = data;
        svg1.appendChild(rect);
        svg1.appendChild(text);
        let svgString = new XMLSerializer().serializeToString(svg1);


        let decoded = unescape(encodeURIComponent(svgString));
        let base64 = btoa(decoded);

        let imgSource = `data:image/svg+xml;base64,${base64}`;
        return imgSource;
    }

    static stringToColour = function (str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let colour = '#';
        for (let i = 0; i < 3; i++) {
            let value = (hash >> (i * 8)) & 0xFF;
            colour += ('00' + value.toString(16)).substr(-2);
        }
        return colour;
    }
}

export default SvgAvatar;