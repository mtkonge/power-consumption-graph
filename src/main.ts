import "./style.css";

interface CO2Emission {
  day: string;
  averageCO2EmissionRate: number;
}

async function CO2EmissionThisYear() {
  const url = `https://api.energidataservice.dk/dataset/CO2Emis?start=StartOfYear&end=now&filter={"PriceArea": ["DK1"]}`;
  return await fetch(url).then((res) => res.json());
}

async function CO2EmissionsDayInterval(): Promise<CO2Emission[]> {
  const CO2Emissions = (await CO2EmissionThisYear()).records.reverse();
  let currentTotalEmissions = 0;
  let result = [];
  for (let i = 0; i < CO2Emissions.length; i++) {
    if (i % (12 * 24 - 1) === 0 && i !== 0) {
      result.push({
        day: CO2Emissions[i].Minutes5DK.split("T")[0],
        averageCO2EmissionRate: currentTotalEmissions / (12 * 24),
      });
      currentTotalEmissions = 0;
    } else {
      currentTotalEmissions += CO2Emissions[i].CO2Emission;
    }
  }
  return result;
}

async function draw2dAxis(
  CO2Emissions: CO2Emission[],
  canvasHTML: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  ctx.fillRect(
    canvasHTML.width / 10,
    (canvasHTML.height / 10) * 9,
    (canvasHTML.width / 10) * 9,
    1
  );
  ctx.fillRect(canvasHTML.width / 10, 0, 1, (canvasHTML.height / 10) * 9);

  for (let i = 0; i < CO2Emissions.length; i++) {
    ctx.fillRect(
      canvasHTML.width / 10 +
        ((canvasHTML.width - canvasHTML.width / 10) / CO2Emissions.length) *
          (i + 1),
      (ctx.canvas.height / 20) * 17.5,
      1,
      ctx.canvas.width / 40
    );
  }

  for (let i = 0; i < 20; i++) {
    ctx.fillRect(
      canvasHTML.width / 11.5,
      ((canvasHTML.height / 10) * 9) / 20 +
        (((canvasHTML.height / 10) * 9) / 20) * i -
        ((canvasHTML.height / 10) * 9) / 20,
      ctx.canvas.width / 40,
      1
    );
  }
}

function maxAverageCO2Emission(CO2Emissions: CO2Emission[]) {
  let max = 0;
  for (let i = 0; i < CO2Emissions.length; i++) {
    if (CO2Emissions[i].averageCO2EmissionRate > max)
      max = CO2Emissions[i].averageCO2EmissionRate;
  }
  return max;
}

function line(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function point(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, 2 * Math.PI);
  ctx.fill();
}

function drawGraph(
  CO2Emissions: CO2Emission[],
  canvasHTML: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  let lastPoint = undefined;
  for (let i = 0; i < CO2Emissions.length; i++) {
    const currentPoint = {
      x:
        canvasHTML.width / 10 +
        ((canvasHTML.width - canvasHTML.width / 10) / CO2Emissions.length) *
          (i + 1),
      y:
        canvasHTML.height -
        canvasHTML.height / 10 -
        ((canvasHTML.height - canvasHTML.height / 10) /
          maxAverageCO2Emission(CO2Emissions)) *
          CO2Emissions[i].averageCO2EmissionRate,
    };
    point(ctx, currentPoint.x, currentPoint.y);
    if (!!lastPoint)
      line(ctx, lastPoint.x, lastPoint.y, currentPoint.x, currentPoint.y);
    lastPoint = currentPoint;
  }
}

const canvasHTML = document.querySelector<HTMLCanvasElement>(
  "#CO2-emissions-canvas"
)!;
canvasHTML.width = 1000;
canvasHTML.height = 500;
const ctx = canvasHTML.getContext("2d")!;
ctx.fillStyle = "#000000";

const CO2Emissions = await CO2EmissionsDayInterval();

draw2dAxis(CO2Emissions, canvasHTML, ctx);

drawGraph(CO2Emissions, canvasHTML, ctx);

console.log(await CO2EmissionsDayInterval());
