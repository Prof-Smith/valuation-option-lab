/* Targeted equity-valuation visual correction.
   Loads the existing notebook-generated model_results.json and redraws only
   the #valuation Plotly panel. No model, workflow, or other dashboard panel changes. */
(function () {
  const MONEY = value => '$' + Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const COLORS = {
    navy: '#0b2747',
    slate: '#68798e',
    gold: '#e2a72d',
    blue: '#197ba6',
    teal: '#0fa99d'
  };

  const CONFIG = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false
  };

  async function redrawEquityValuation() {
    const chart = document.getElementById('valuation');
    if (!chart || typeof Plotly === 'undefined') return;

    const response = await fetch('model_results.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('model_results.json was not generated');
    const data = await response.json();

    const entries = Object.entries(data.valuation || {});
    if (!entries.length) throw new Error('No valuation results were found');

    const labels = entries.map(([label]) => label);
    const values = entries.map(([, value]) => Number(value));
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const observedSpot = Number(data.model.spot);
    const spread = Math.max(maximum - minimum, 1);
    const leftPadding = Math.max(spread * 0.75, 5);
    const rightPadding = Math.max(spread * 0.95, 6);
    const colors = [COLORS.slate, COLORS.gold, COLORS.blue, COLORS.teal];

    const guideLines = values.map((value, index) => ({
      type: 'line',
      x0: minimum - leftPadding * 0.42,
      x1: value,
      y0: labels[index],
      y1: labels[index],
      line: { color: colors[index], width: 4 }
    }));

    guideLines.push({
      type: 'line',
      x0: observedSpot,
      x1: observedSpot,
      y0: -0.48,
      y1: labels.length - 0.52,
      line: { color: COLORS.navy, width: 2, dash: 'dot' }
    });

    const trace = {
      type: 'scatter',
      mode: 'markers+text',
      x: values,
      y: labels,
      marker: {
        size: 18,
        color: colors,
        line: { color: '#ffffff', width: 2 }
      },
      text: values.map(MONEY),
      textposition: 'middle right',
      textfont: { size: 14, color: COLORS.navy },
      cliponaxis: false,
      hovertemplate: '<b>%{y}</b><br>Value per share: <b>%{x:$,.2f}</b><extra></extra>'
    };

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: false,
      font: {
        family: 'Inter, Segoe UI, Arial, sans-serif',
        size: 13,
        color: '#10243d'
      },
      margin: { l: 150, r: 82, t: 42, b: 64 },
      hoverlabel: {
        bgcolor: COLORS.navy,
        bordercolor: COLORS.navy,
        font: { size: 14, color: '#ffffff' }
      },
      xaxis: {
        title: { text: 'Equity value per share', font: { size: 12 } },
        tickprefix: '$',
        tickformat: ',.0f',
        range: [minimum - leftPadding, maximum + rightPadding],
        nticks: 6,
        gridcolor: '#e2e9f0',
        zeroline: false,
        automargin: true,
        tickfont: { size: 12, color: '#50647c' }
      },
      yaxis: {
        autorange: 'reversed',
        gridcolor: 'rgba(0,0,0,0)',
        automargin: true,
        tickfont: { size: 12, color: COLORS.navy }
      },
      shapes: guideLines,
      annotations: [{
        x: observedSpot,
        y: 1.08,
        xref: 'x',
        yref: 'paper',
        text: 'Market reference ' + MONEY(observedSpot),
        showarrow: false,
        xanchor: 'center',
        font: { size: 11, color: COLORS.navy },
        bgcolor: 'rgba(255,255,255,0.94)',
        bordercolor: '#d6e1eb',
        borderwidth: 1,
        borderpad: 4
      }]
    };

    await Plotly.react(chart, [trace], layout, CONFIG);
  }

  function start() {
    redrawEquityValuation().catch(error => {
      console.error('Equity valuation chart update failed:', error);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 250));
  } else {
    setTimeout(start, 250);
  }
}());
