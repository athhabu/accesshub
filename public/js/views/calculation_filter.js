// =============================================================================
// Calculation Filter View — Check #41
// =============================================================================
// Realistic internal financial calculation and adjustment modeling tool.
// The vulnerability lives entirely on the server side (Expression Language Injection)
// and is not hinted at anywhere in the UI.
// =============================================================================

const CalculationFilterView = {
  render(user) {
    return `
      <div class="max-w-5xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="font-headline-sm text-headline-sm font-bold text-on-surface">Calculation Filter & Modeling</h1>
            <p class="text-sm text-on-surface-variant mt-1">Simulate corporate expense adjustments, unit cost variances, and departmental budget allocations.</p>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px] text-primary">calculate</span>
            <span>FinCalc Engine v3.1</span>
          </div>
        </div>

        <!-- Main Form Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6">
          <div class="flex items-center gap-2.5 pb-4 mb-5 border-b border-outline-variant/20">
            <span class="material-symbols-outlined text-primary text-[22px]">tune</span>
            <h2 class="font-title-md text-title-md font-semibold text-on-surface">Adjustment Parameters</h2>
          </div>

          <form id="calc-filter-form" onsubmit="event.preventDefault(); CalculationFilterView.evaluate();" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Calculation Type -->
              <div>
                <label for="calc-type" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Calculation Model
                </label>
                <select
                  id="calc-type"
                  class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="expense" selected>Expense Subtotal Adjustment</option>
                  <option value="budget">Department Budget Offset</option>
                  <option value="margin">Projected Operating Margin</option>
                </select>
              </div>

              <!-- Base Amount -->
              <div>
                <label for="calc-amount" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Unit Amount ($)
                </label>
                <input
                  id="calc-amount"
                  type="number"
                  step="0.01"
                  value="125.50"
                  placeholder="e.g. 100.00"
                  class="w-full h-10 px-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <!-- Quantity -->
              <div>
                <label for="calc-quantity" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Quantity Units
                </label>
                <input
                  id="calc-quantity"
                  type="number"
                  step="1"
                  min="1"
                  value="10"
                  placeholder="e.g. 5"
                  class="w-full h-10 px-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <!-- Adjustment Formula Input -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="calc-formula" class="block font-label-md text-label-md font-medium text-on-surface">
                  Adjustment Expression / Allowance ($)
                </label>
                <span class="text-xs text-on-surface-variant font-mono">Accepts formula or fixed delta</span>
              </div>
              <input
                id="calc-formula"
                type="text"
                value="25.00"
                placeholder="e.g. 15.50 or discount * 100"
                class="w-full h-10 px-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm font-mono text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                required
              />
              <p class="text-xs text-on-surface-variant mt-1.5">
                Standard variables: <code class="bg-surface-container px-1 py-0.5 rounded text-primary">discount</code>, <code class="bg-surface-container px-1 py-0.5 rounded text-primary">taxRate</code>, <code class="bg-surface-container px-1 py-0.5 rounded text-primary">overhead</code>, <code class="bg-surface-container px-1 py-0.5 rounded text-primary">margin</code>
              </p>
            </div>

            <!-- Submit Button -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onclick="CalculationFilterView.resetForm()"
                class="h-10 px-4 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Reset
              </button>
              <button
                id="calc-run-btn"
                type="submit"
                class="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-sm font-semibold shadow-sm flex items-center gap-2 transition-colors"
              >
                <span class="material-symbols-outlined text-[18px]">play_arrow</span>
                Evaluate Calculation
              </button>
            </div>
          </form>
        </div>

        <!-- Calculation Result Display -->
        <div id="calc-output-container"></div>
      </div>
    `;
  },

  afterRender() {
    this.evaluate();
  },

  resetForm() {
    const form = document.getElementById('calc-filter-form');
    if (form) {
      document.getElementById('calc-type').value = 'expense';
      document.getElementById('calc-amount').value = '125.50';
      document.getElementById('calc-quantity').value = '10';
      document.getElementById('calc-formula').value = '25.00';
      this.evaluate();
    }
  },

  async evaluate() {
    const amountEl   = document.getElementById('calc-amount');
    const qtyEl      = document.getElementById('calc-quantity');
    const formulaEl  = document.getElementById('calc-formula');
    const typeEl     = document.getElementById('calc-type');
    const btn        = document.getElementById('calc-run-btn');
    const container  = document.getElementById('calc-output-container');

    if (!amountEl || !container) return;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Computing...';
    }

    try {
      const payload = {
        amount: parseFloat(amountEl.value) || 0,
        quantity: parseInt(qtyEl.value, 10) || 1,
        adjustmentFormula: formulaEl ? formulaEl.value.trim() : '0',
        calcType: typeEl ? typeEl.value : 'expense'
      };

      const res = await State.apiFetch('/api/calculations/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        if (res.error) {
          container.innerHTML = `
            <div class="rounded-2xl bg-error-container/20 border border-error/30 p-5 flex items-start gap-3">
              <span class="material-symbols-outlined text-error text-[24px] shrink-0">error</span>
              <div>
                <h3 class="font-title-sm font-semibold text-on-surface">Evaluation Error</h3>
                <p class="text-xs text-on-surface-variant font-mono mt-1">${res.error}</p>
                <p class="text-xs text-on-surface-variant mt-2">Expression attempted: <code class="font-mono bg-surface-container px-1 py-0.5 rounded">${res.expression || 'N/A'}</code></p>
              </div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-md p-6">
              <div class="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-outline-variant/20">
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-primary text-[20px]">analytics</span>
                  <h3 class="font-title-md font-semibold text-on-surface">Calculation Summary</h3>
                </div>
                <span class="px-2.5 py-1 rounded bg-secondary-container/30 text-secondary text-xs font-semibold uppercase">
                  Model: ${res.calcType}
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div class="p-4 rounded-xl bg-surface-container-low">
                  <div class="text-xs text-on-surface-variant font-medium">Subtotal (Amt × Qty)</div>
                  <div class="text-lg font-bold text-on-surface mt-1">$${res.subtotal !== null ? Number(res.subtotal).toFixed(2) : '0.00'}</div>
                </div>
                <div class="p-4 rounded-xl bg-surface-container-low">
                  <div class="text-xs text-on-surface-variant font-medium">Quantity</div>
                  <div class="text-lg font-bold text-on-surface mt-1">${res.quantity} units</div>
                </div>
                <div class="p-4 rounded-xl bg-surface-container-low">
                  <div class="text-xs text-on-surface-variant font-medium">Adjustment Derived</div>
                  <div class="text-lg font-bold text-on-surface mt-1">$${res.adjustmentApplied !== null ? Number(res.adjustmentApplied).toFixed(2) : '0.00'}</div>
                </div>
                <div class="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div class="text-xs text-primary font-medium">Final Computed Result</div>
                  <div class="text-xl font-bold text-primary mt-1">$${res.result !== null ? Number(res.result).toFixed(2) : '0.00'}</div>
                </div>
              </div>

              <div class="p-3 rounded-lg bg-surface-container-low flex items-center justify-between text-xs text-on-surface-variant font-mono">
                <span>Evaluated Formula:</span>
                <span class="text-on-surface font-semibold">${res.expression}</span>
              </div>
            </div>
          `;
        }
      } else {
        throw new Error((res && res.error) || 'Failed to evaluate calculation');
      }
    } catch (err) {
      State.showToast(err.message || 'Evaluation failed', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">play_arrow</span> Evaluate Calculation';
      }
    }
  }
};

window.CalculationFilterView = CalculationFilterView;
