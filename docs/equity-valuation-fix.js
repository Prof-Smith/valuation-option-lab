/* Equity valuation panel fix v2
   Waits for the async dashboard render, then replaces only #valuation.
*/
(function () {
  'use strict';

  const COLORS = {
    navy: '#0b2747',
    slate: '#68798e',
    gold: '#e2a72d',
    blue: '#197ba6',
    teal: '#0fa99d'
  };

  const money = value => '$' + Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const config = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: false
  };

  let modelResults = null;
  let rendering = false;
  let completed = false;

  async function getModelResults() {
    if (modelResults) return modelResults;
    const response = await fetch('model_results.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load model_results.json');
    modelResults = await response.json();
    return modelResults;
  }

  async function replaceValuationChart() {
    if (rendering || completed) return;

    const chart = document.getElementById('valuation');
    if (!chart || typeof window.Plotly === 'undefined') return;

    rendering = true;
    try {
      const data = await getModelResults();
      const entries = Object.entries(data.valuation || {});
      if (!entries.length) throw new Error('No equity valuation results found');

      const labels = entries.map(([label]) => label);
      const values = entries.map(([, value]) => Number(value));
      const colors = [COLORS.slate, COLORS.gold, COLORS.blue, COLORS.teal];
      const observedSpot = Number(data.model.spot);
      const minimum = Math.min(...values);
      const maximum = Math.max(...values);
      const spread = Math.max(maximum - minimum, 1);
      const axisMinimum = minimum - Math.max(spread * 0.65, 4);
      const axisMaximum = maximum + Math.max(spread * 0.95, 6);

      const connectorLines = values.map((value, index) => ({
        type: 'line',
        xref: 'x',
        yref: 'y',
        x0: axisMinimum + (axisMaximum - axisMinimum) * 0.04,
        x1: value,
        y0: labels[index],
        y1: labels[index],
        layer: 'below',
        line: { color: colors[index], width: 4 }
      }));

      connectorLines.push({
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: observedSpot,
        x1: observedSpot,
        y0: 0,
        y1: 1,
        layer: 'below',
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
        text: values.map(money),
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
        margin: { l: 150, r: 86, t: 54, b: 64 },
        hoverlabel: {
          bgcolor: COLORS.navy,
          bordercolor: COLORS.navy,
          font: { size: 14, color: '#ffffff' }
        },
        xaxis: {
          title: { text: 'Equity value per share', font: { size: 12 } },
          tickprefix: '$',
          tickformat: ',.0f',
          range: [axisMinimum, axisMaximum],
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
        shapes: connectorLines,
        annotations: [{
          x: observedSpot,
          y: 1.12,
          xref: 'x',
          yref: 'paper',
          text: 'Market reference ' + money(observedSpot),
          showarrow: false,
          xanchor: 'center',
          font: { size: 11, color: COLORS.navy },
          bgcolor: 'rgba(255,255,255,0.95)',
          bordercolor: '#d6e1eb',
          borderwidth: 1,
          borderpad: 4
        }]
      };

      await Plotly.react(chart, [trace], layout, config);
      chart.dataset.equityFixApplied = 'true';
      completed = true;
      observer.disconnect();
      console.info('Equity valuation chart fix applied.');
    } catch (error) {
      console.error('Equity valuation chart fix failed:', error);
    } finally {
      rendering = false;
    }
  }

  const observer = new MutationObserver(() => {
    const chart = document.getElementById('valuation');
    if (chart && chart.dataset.equityFixApplied !== 'true') {
      window.setTimeout(replaceValuationChart, 50);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener('load', () => {
    window.setTimeout(replaceValuationChart, 100);
  });

  window.setTimeout(replaceValuationChart, 300);
}());
