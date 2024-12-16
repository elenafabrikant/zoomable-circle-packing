function _1(md) {
  return md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">Zoomable circle packing</h1> </div>`;
}

function _chart(d3, data) {
  const width = 600;
  const height = width;

  const color = d3.scaleLinear()
      .domain([0, 5])
      .range(["hsl(281,100%,10%)", "hsl(293,80%,40%)"])
      .interpolate(d3.interpolateHcl);

  const pack = data => d3.pack()
      .size([width, height])
      .padding(1)
    (d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value));

  const root = pack(data);
  // SVG-Element

  const svg = d3.create("svg")
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr("style", `background: ${color(0)}; cursor: pointer;`);

  const node = svg.append("g")
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);
  
  // Sichtbarer Kreis
  node.append("circle")
  .attr("r", d => d.r)
  .attr("fill", d => d.children ? color(d.depth) : "#A169BD")
  .attr("pointer-events", "auto")
 
  .on("mouseover", function() { d3.select(this).attr("stroke", "#E998F4"); })
  .on("mouseout", function() { d3.select(this).attr("stroke", null); })
  .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));


  // Text für den Firmennamen
  node.each(function(d) {
    const group = d3.select(this);
    const textLines = splitText(d.data.name, Math.max(6, d.r / 5)); 
    const lineHeight = 1.1; 

    textLines.forEach((line, i) => {
      group.append("text")
        .attr("class", "company-name")
        .style("font-family", "Roboto, sans-serif")
        .style("fill", "#220032")
        .style("text-anchor", "middle")
        .style("font-size", `${Math.min(14, d.r / 5)}px`)
        .attr("data-original-font-size", `${Math.min(14, d.r / 5)}px`) 
        .attr("dy", `${(i - (textLines.length - 1) / 2) * lineHeight}em`) 
        .style("pointer-events", "none")
        .text(line);
    });

    // Text für die Zahl 
    const textHeight = textLines.length * 1.2; 
    const fixedOffset = 1.2; 
    const numberDy = `${textHeight + fixedOffset}em`; 
    group.append("text")
      .attr("class", "number")
      .style("font-family", "Roboto, sans-serif")
      .style("fill", "#220032")
      .style("text-anchor", "middle")
      .style("font-size", "14px") 
      .style("opacity", 0) 
      .attr("dy", numberDy) 
      .text(d => d.data.number ? d.data.number : ''); 
  });

  // Zoom-Funktion
  svg.on("click", (event) => zoom(event, root));
  let focus = root;
  let view;

  zoomTo([focus.x, focus.y, focus.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];
    view = v;

    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.select("circle").attr("r", d => d.r * k);
  }

  function zoom(event, d) {
    const focus0 = focus;
    focus = d;

    const transition = svg.transition()
      .duration(750)
      .tween("zoom", () => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return t => zoomTo(i(t));
      });

   
    node.selectAll(".company-name")
      .transition(transition)
      .style("font-size", function(d) {
        return d === focus ? "42px" : d3.select(this).attr("data-original-font-size"); 
      });

   
    node.selectAll(".number")
      .transition(transition)
      .style("font-size", d => d === focus ? "24px" : "14px") 
      .style("opacity", d => d === focus ? 1 : 0)
      .attr("dy", function() {
        return d3.select(this).attr("dy");
      });
  }
// Funktion zum Aufteilen des Textes in mehrere Zeilen
  function splitText(text, maxChars) {
    const words = text.split(' ');
    let result = [];
    let line = '';

    words.forEach(word => {
      if ((line + ' ' + word).trim().length > maxChars) {
        result.push(line.trim());
        line = word;
      } else {
        line += (line === '' ? '' : ' ') + word;
      }
    });

    result.push(line.trim());
    return result;
  }

  // Container für das SVG-Element

  const container = d3.create("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("width", "100vw")
    .style("height", "100vh")
    .style("background", `${color(0)}`);

  container.node().appendChild(svg.node());

  return container.node();
}

function _data(FileAttachment) {
  return FileAttachment("hallo.json").json();
}

export default function define(runtime, observer) {
  const main = runtime.module();
  const fileAttachments = new Map([
    ["hallo.json", { url: new URL("./files/hallo.json", import.meta.url) }]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable().define(["md"], _1);
  main.variable(observer("chart")).define("chart", ["d3", "data"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  return main;
}
