/* app.js — The Great Migration: Substack vs X Dashboard */

'use strict';

/* ============================================================
   GLOBAL CHART DEFAULTS
   ============================================================ */
Chart.defaults.color = '#666';
Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.display = false;

const SUBSTACK = '#00e5c7';
const SUBSTACK_DIM = 'rgba(0,229,199,0.15)';
const SUBSTACK_FILL = 'rgba(0,229,199,0.08)';
const X_RED = '#e84545';
const X_DIM = 'rgba(232,69,69,0.15)';
const X_FILL = 'rgba(232,69,69,0.06)';
const NEUTRAL = 'rgba(255,255,255,0.3)';
const NEUTRAL_DIM = 'rgba(255,255,255,0.06)';
const GRID_COLOR = 'rgba(255,255,255,0.05)';
const TICK_COLOR = '#444';

/* ============================================================
   STICKY HEADER SCROLL EFFECT
   ============================================================ */
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ============================================================
   MOBILE NAV TOGGLE
   ============================================================ */
const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    siteNav.classList.toggle('open');
  });
  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => siteNav.classList.remove('open'));
  });
}

/* ============================================================
   QUOTES CAROUSEL
   ============================================================ */
let currentQuote = 0;
const quoteCards = document.querySelectorAll('.quote-card');
const quoteDots = document.querySelectorAll('.quote-dot');

function goToQuote(index) {
  quoteCards.forEach(c => c.classList.remove('active'));
  quoteDots.forEach(d => d.classList.remove('active'));
  currentQuote = (index + quoteCards.length) % quoteCards.length;
  quoteCards[currentQuote].classList.add('active');
  quoteDots[currentQuote].classList.add('active');
}

document.getElementById('quoteNext')?.addEventListener('click', () => goToQuote(currentQuote + 1));
document.getElementById('quotePrev')?.addEventListener('click', () => goToQuote(currentQuote - 1));
quoteDots.forEach(dot => {
  dot.addEventListener('click', () => goToQuote(parseInt(dot.dataset.index)));
});

// Auto-advance every 6 seconds
let quoteTimer = setInterval(() => goToQuote(currentQuote + 1), 6000);
document.getElementById('quotesCarousel')?.addEventListener('mouseenter', () => clearInterval(quoteTimer));
document.getElementById('quotesCarousel')?.addEventListener('mouseleave', () => {
  quoteTimer = setInterval(() => goToQuote(currentQuote + 1), 6000);
});

/* ============================================================
   INTERSECTION OBSERVER — scroll-triggered animations
   ============================================================ */
const animateObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger children
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      animateObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

// Stagger metric cards
document.querySelectorAll('.metric-card').forEach((el, i) => {
  el.dataset.delay = i * 60;
  animateObserver.observe(el);
});

// Stagger exodus items
document.querySelectorAll('.exodus-item, .person-card').forEach((el, i) => {
  el.dataset.delay = i * 50;
  animateObserver.observe(el);
});

// Generic animate-in elements
document.querySelectorAll('.animate-in').forEach(el => {
  if (!el.dataset.delay) el.dataset.delay = 0;
  animateObserver.observe(el);
});

/* ============================================================
   CHART FACTORIES
   ============================================================ */

// Common axis config
function axisConfig(color) {
  return {
    ticks: { color: TICK_COLOR, font: { size: 10 } },
    grid: { color: GRID_COLOR, drawBorder: false },
    border: { color: 'transparent' }
  };
}

function yAxisConfig(formatter) {
  return {
    ...axisConfig(),
    ticks: {
      color: TICK_COLOR,
      font: { size: 10 },
      callback: formatter || (v => v)
    }
  };
}

/* ============================================================
   CHART REGISTRY — charts init when canvas enters viewport
   ============================================================ */
const chartRegistry = {};
let chartsInitialized = {};

function initChartWhenVisible(id, initFn) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !chartsInitialized[id]) {
        chartsInitialized[id] = true;
        chartRegistry[id] = initFn(canvas);
        obs.unobserve(canvas);
      }
    });
  }, { threshold: 0.1 });
  obs.observe(canvas);
}

/* ============================================================
   SECTION 2: GROWTH CHARTS
   ============================================================ */

// Substack Paid Subscribers
initChartWhenVisible('substackGrowthChart', (canvas) => {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: ["Jul '18","Oct '18","Apr '19","Jul '19","Mar '20","Sep '20","Feb '21","Nov '21","Feb '23","Feb '24","Nov '24","Mar '25"],
      datasets: [{
        data: [11000, 25000, 40000, 50000, 100000, 250000, 500000, 1000000, 2000000, 3000000, 4000000, 5000000],
        borderColor: SUBSTACK,
        borderWidth: 2,
        pointBackgroundColor: SUBSTACK,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          g.addColorStop(0, 'rgba(0,229,199,0.15)');
          g.addColorStop(1, 'rgba(0,229,199,0)');
          return g;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: SUBSTACK,
          borderWidth: 1,
          titleColor: SUBSTACK,
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' ' + (ctx.raw >= 1000000 ? (ctx.raw/1000000).toFixed(1) + 'M' : (ctx.raw/1000).toFixed(0) + 'K') + ' paid subscribers'
          }
        }
      },
      scales: {
        x: { ...axisConfig(), ticks: { color: TICK_COLOR, font: { size: 9 }, maxRotation: 45 } },
        y: yAxisConfig(v => v >= 1000000 ? (v/1000000) + 'M' : (v/1000) + 'K')
      }
    }
  });
});

// X US Usage Rate
initChartWhenVisible('xUsageChart', (canvas) => {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['2019','2020','2021','2022','2023','2024','2025 (teen)'],
      datasets: [{
        data: [27, 27, 27, 27, 27, 19, 16],
        borderColor: X_RED,
        borderWidth: 2,
        pointBackgroundColor: (ctx) => {
          return ctx.dataIndex >= 5 ? X_RED : 'rgba(232,69,69,0.5)';
        },
        pointRadius: (ctx) => ctx.dataIndex >= 5 ? 5 : 3,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          g.addColorStop(0, 'rgba(232,69,69,0.12)');
          g.addColorStop(1, 'rgba(232,69,69,0)');
          return g;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: X_RED,
          borderWidth: 1,
          titleColor: X_RED,
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' ' + ctx.raw + '% of US adults use X'
          }
        },
        annotation: {}
      },
      scales: {
        x: axisConfig(),
        y: {
          ...yAxisConfig(v => v + '%'),
          min: 0,
          max: 35,
          ticks: { color: TICK_COLOR, font: { size: 10 }, callback: v => v + '%' }
        }
      }
    }
  });
});

// Competitor growth (Threads + Bluesky)
initChartWhenVisible('competitorChart', (canvas) => {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ["Threads Jul '23","Threads Q3 '24","Threads Q1 '25","Threads Q3 '25","Bluesky Sep '24","Bluesky Nov '24","Bluesky Aug '25","Bluesky Nov '25"],
      datasets: [{
        data: [100, 200, 305, 400, 10, 20, 38, 40],
        backgroundColor: [
          'rgba(0,229,199,0.7)','rgba(0,229,199,0.7)','rgba(0,229,199,0.7)','rgba(0,229,199,0.7)',
          'rgba(100,180,255,0.7)','rgba(100,180,255,0.7)','rgba(100,180,255,0.7)','rgba(100,180,255,0.7)'
        ],
        borderColor: [
          SUBSTACK, SUBSTACK, SUBSTACK, SUBSTACK,
          '#64b4ff','#64b4ff','#64b4ff','#64b4ff'
        ],
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: SUBSTACK,
          borderWidth: 1,
          titleColor: '#e8e8e8',
          bodyColor: '#a0a0a0',
          callbacks: {
            label: ctx => ' ' + ctx.raw + 'M MAU'
          }
        },
        legend: {
          display: true,
          labels: {
            generateLabels: () => [
              { text: 'Threads', fillStyle: 'rgba(0,229,199,0.7)', strokeStyle: SUBSTACK, lineWidth: 1, fontColor: '#a0a0a0' },
              { text: 'Bluesky', fillStyle: 'rgba(100,180,255,0.7)', strokeStyle: '#64b4ff', lineWidth: 1, fontColor: '#a0a0a0' }
            ]
          }
        }
      },
      scales: {
        x: { ...axisConfig(), ticks: { color: TICK_COLOR, font: { size: 9 }, maxRotation: 45 } },
        y: yAxisConfig(v => v + 'M')
      }
    }
  });
});

/* ============================================================
   SECTION 3: REVENUE CHARTS
   ============================================================ */

// X Revenue
initChartWhenVisible('xRevenueChart', (canvas) => {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['2021','2022','2023','2024'],
      datasets: [{
        label: 'Total Revenue ($B)',
        data: [5.08, 4.4, 3.4, 2.5],
        backgroundColor: ['rgba(232,69,69,0.5)','rgba(232,69,69,0.55)','rgba(232,69,69,0.65)','rgba(232,69,69,0.8)'],
        borderColor: X_RED,
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: X_RED,
          borderWidth: 1,
          titleColor: X_RED,
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' $' + ctx.raw + 'B'
          }
        }
      },
      scales: {
        x: axisConfig(),
        y: { ...yAxisConfig(v => '$' + v + 'B'), min: 0, max: 6 }
      }
    }
  });
});

// Substack Revenue
initChartWhenVisible('substackRevenueChart', (canvas) => {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['2020','2021','2022','2023','2024','2025'],
      datasets: [{
        label: 'ARR ($M)',
        data: [2.4, 11.9, 19, 30, 37, 45],
        backgroundColor: ['rgba(0,229,199,0.3)','rgba(0,229,199,0.4)','rgba(0,229,199,0.5)','rgba(0,229,199,0.6)','rgba(0,229,199,0.7)','rgba(0,229,199,0.85)'],
        borderColor: SUBSTACK,
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: SUBSTACK,
          borderWidth: 1,
          titleColor: SUBSTACK,
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' $' + ctx.raw + 'M ARR'
          }
        }
      },
      scales: {
        x: axisConfig(),
        y: { ...yAxisConfig(v => '$' + v + 'M'), min: 0 }
      }
    }
  });
});

// X Brand Value Collapse
initChartWhenVisible('xBrandChart', (canvas) => {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['2022','2023','2024','2025'],
      datasets: [{
        data: [5.7, 3.9, 0.673, 0.498],
        borderColor: X_RED,
        borderWidth: 2.5,
        pointBackgroundColor: X_RED,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.35,
        fill: true,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          g.addColorStop(0, 'rgba(232,69,69,0.15)');
          g.addColorStop(1, 'rgba(232,69,69,0)');
          return g;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: X_RED,
          borderWidth: 1,
          titleColor: X_RED,
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' $' + ctx.raw + 'B brand value'
          }
        }
      },
      scales: {
        x: axisConfig(),
        y: { ...yAxisConfig(v => '$' + v + 'B'), min: 0, max: 6.5 }
      }
    }
  });
});

// Substack Valuation
initChartWhenVisible('substackValChart', (canvas) => {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['2019','2021','2023','2025'],
      datasets: [{
        data: [0.049, 0.65, 0.585, 1.1],
        borderColor: SUBSTACK,
        borderWidth: 2.5,
        pointBackgroundColor: SUBSTACK,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.35,
        fill: true,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          g.addColorStop(0, 'rgba(0,229,199,0.15)');
          g.addColorStop(1, 'rgba(0,229,199,0)');
          return g;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: SUBSTACK,
          borderWidth: 1,
          titleColor: SUBSTACK,
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' $' + (ctx.raw >= 1 ? ctx.raw.toFixed(1) + 'B' : (ctx.raw * 1000).toFixed(0) + 'M') + ' valuation'
          }
        }
      },
      scales: {
        x: axisConfig(),
        y: { ...yAxisConfig(v => '$' + v + 'B'), min: 0, max: 1.3 }
      }
    }
  });
});

/* ============================================================
   SECTION 4: TRUST CHART
   ============================================================ */

initChartWhenVisible('trustChart', (canvas) => {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [
        'Hate speech increase (post-acquisition)',
        'Decline in high-credibility content sharing',
        'Safety engineers cut',
        'Content moderators cut',
        'Marketers calling X ads "brand-safe"'
      ],
      datasets: [{
        data: [50, 27.84, 80, 52, 4],
        backgroundColor: [
          'rgba(232,69,69,0.75)',
          'rgba(232,69,69,0.65)',
          'rgba(232,69,69,0.75)',
          'rgba(232,69,69,0.65)',
          'rgba(232,69,69,0.4)'
        ],
        borderColor: X_RED,
        borderWidth: 1,
        borderRadius: 3,
        barThickness: 28
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: X_RED,
          borderWidth: 1,
          titleColor: '#e8e8e8',
          bodyColor: X_RED,
          callbacks: {
            label: ctx => ' ' + ctx.raw + '%'
          }
        }
      },
      scales: {
        x: {
          ...axisConfig(),
          max: 100,
          ticks: {
            color: TICK_COLOR,
            font: { size: 10 },
            callback: v => v + '%'
          }
        },
        y: {
          ...axisConfig(),
          ticks: {
            color: '#888',
            font: { size: 11 },
            autoSkip: false
          }
        }
      }
    }
  });
});

/* ============================================================
   SECTION 03b: ADVERTISER EXODUS CHARTS
   ============================================================ */

const THREADS = '#f5a623';
const THREADS_DIM = 'rgba(245,166,35,0.15)';
const THREADS_FILL = 'rgba(245,166,35,0.08)';
const X_RED_DIM = 'rgba(232,69,69,0.35)';

// Brand Spending Collapse — grouped horizontal bar chart
initChartWhenVisible('brandSpendChart', (canvas) => {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['AT&T', 'Disney', 'Comcast', 'Apple', 'Microsoft'],
      datasets: [
        {
          label: '2022 Spend',
          data: [33.4, 27.7, 22.5, 20.4, 11.0],
          backgroundColor: 'rgba(232,69,69,0.35)',
          borderColor: 'rgba(232,69,69,0.6)',
          borderWidth: 1,
          borderRadius: 3
        },
        {
          label: '2025 Spend',
          data: [0.1, 0.5, 1.7, 0.5, 0.4],
          backgroundColor: 'rgba(232,69,69,0.85)',
          borderColor: X_RED,
          borderWidth: 1,
          borderRadius: 3
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: X_RED,
          borderWidth: 1,
          titleColor: '#e8e8e8',
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' ' + ctx.dataset.label + ': $' + ctx.raw + 'M'
          }
        },
        legend: {
          display: true,
          labels: {
            color: '#888',
            font: { size: 11 },
            boxWidth: 12,
            padding: 16,
            generateLabels: (chart) => [
              { text: '2022 Spend', fillStyle: 'rgba(232,69,69,0.35)', strokeStyle: 'rgba(232,69,69,0.6)', lineWidth: 1, fontColor: '#888' },
              { text: '2025 Spend', fillStyle: 'rgba(232,69,69,0.85)', strokeStyle: X_RED, lineWidth: 1, fontColor: '#888' }
            ]
          }
        }
      },
      scales: {
        x: {
          ...axisConfig(),
          ticks: {
            color: TICK_COLOR,
            font: { size: 10 },
            callback: v => '$' + v + 'M'
          }
        },
        y: {
          ...axisConfig(),
          ticks: { color: '#888', font: { size: 11 }, autoSkip: false }
        }
      }
    }
  });
});

// Ad Revenue Timeline — line chart
initChartWhenVisible('adRevenueChart', (canvas) => {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Jun 2022 – May 2023', 'Jun 2023 – May 2024', 'Jun 2024 – May 2025'],
      datasets: [{
        data: [2.03, 1.82, 1.33],
        borderColor: X_RED,
        borderWidth: 2.5,
        pointBackgroundColor: X_RED,
        pointRadius: 6,
        pointHoverRadius: 9,
        tension: 0.35,
        fill: true,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          g.addColorStop(0, 'rgba(232,69,69,0.15)');
          g.addColorStop(1, 'rgba(232,69,69,0)');
          return g;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: X_RED,
          borderWidth: 1,
          titleColor: X_RED,
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' $' + ctx.raw + 'B rolling ad revenue'
          }
        }
      },
      scales: {
        x: { ...axisConfig(), ticks: { color: TICK_COLOR, font: { size: 10 }, maxRotation: 0 } },
        y: {
          ...yAxisConfig(v => '$' + v + 'B'),
          min: 0,
          max: 2.5,
          ticks: { color: TICK_COLOR, font: { size: 10 }, callback: v => '$' + v + 'B' }
        }
      }
    }
  });
});

/* ============================================================
   SECTION 03c: APP & TRAFFIC TRENDS CHARTS
   ============================================================ */

// Mobile DAU Race — dual-line crossover chart
initChartWhenVisible('dauRaceChart', (canvas) => {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Jun 2025', 'Sep 2025', 'Oct 2025', 'Jan 2026'],
      datasets: [
        {
          label: 'X',
          data: [132, 130.1, 124.7, 125],
          borderColor: X_RED,
          borderWidth: 2.5,
          pointBackgroundColor: X_RED,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.3,
          fill: false
        },
        {
          label: 'Threads',
          data: [115.1, 130.2, 128.2, 141.5],
          borderColor: THREADS,
          borderWidth: 2.5,
          pointBackgroundColor: THREADS,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1300, easing: 'easeInOutQuart' },
      plugins: {
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: NEUTRAL,
          borderWidth: 1,
          titleColor: '#e8e8e8',
          bodyColor: '#e8e8e8',
          callbacks: {
            label: ctx => ' ' + ctx.dataset.label + ': ' + ctx.raw + 'M DAU'
          }
        },
        legend: {
          display: true,
          labels: {
            color: '#888',
            font: { size: 12 },
            boxWidth: 14,
            padding: 20,
            generateLabels: (chart) => [
              { text: 'X (Twitter)', fillStyle: X_RED, strokeStyle: X_RED, lineWidth: 2, fontColor: '#888' },
              { text: 'Threads', fillStyle: THREADS, strokeStyle: THREADS, lineWidth: 2, fontColor: '#888' }
            ]
          }
        }
      },
      scales: {
        x: { ...axisConfig(), ticks: { color: TICK_COLOR, font: { size: 11 } } },
        y: {
          ...yAxisConfig(v => v + 'M'),
          min: 100,
          max: 155,
          ticks: { color: TICK_COLOR, font: { size: 10 }, callback: v => v + 'M' }
        }
      }
    }
  });
});

/* ============================================================
   ACTIVE NAV HIGHLIGHT
   ============================================================ */
const sections = document.querySelectorAll('section[id], main > *[id]');
const navLinks = document.querySelectorAll('.site-nav a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = '#00e5c7';
        }
      });
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });

sections.forEach(s => navObserver.observe(s));
