// Corporate Calendar View (BAC #20 — Unauthorized Event Modification)
const CalendarView = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  selectedEventId: null,
  events: [],

  async render(currentUser) {
    const user = currentUser || State.user;
    const isAdmin = user && user.role === 'Administrator';

    let allEvents = [];
    try {
      const allRes = await State.apiFetch('/api/events');
      allEvents = allRes.events || [];
    } catch {
      allEvents = [];
    }
    this.events = allEvents;

    const monthName = new Date(this.currentYear, this.currentMonth - 1, 1)
      .toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const selectedEvent = this.selectedEventId
      ? allEvents.find(e => e.id === this.selectedEventId) || null
      : null;

    const typeColors = {
      'All-Hands': 'bg-primary/10 text-primary border-primary/20',
      'Town Hall': 'bg-primary/10 text-primary border-primary/20',
      'Team Meeting': 'bg-secondary/10 text-secondary border-secondary/20',
      'Standup': 'bg-secondary/10 text-secondary border-secondary/20',
      'Sprint Planning': 'bg-tertiary-container/20 text-tertiary-container border-tertiary-container/30',
      'Strategy Session': 'bg-tertiary-container/20 text-tertiary-container border-tertiary-container/30',
      'Post-Mortem': 'bg-error/10 text-error border-error/20',
      'Onboarding': 'bg-secondary/10 text-secondary border-secondary/20',
      'Calibration': 'bg-primary/10 text-primary border-primary/20',
      'Workshop': 'bg-tertiary-container/20 text-tertiary-container border-tertiary-container/30',
    };

    const firstDay = new Date(Date.UTC(this.currentYear, this.currentMonth - 1, 1));
    const lastDay  = new Date(Date.UTC(this.currentYear, this.currentMonth, 0));
    const startDow   = firstDay.getUTCDay();
    const daysInMonth = lastDay.getUTCDate();

    const eventsByDay = {};
    for (const ev of allEvents) {
      const d = new Date(ev.startDate);
      if (d.getUTCMonth() + 1 === this.currentMonth && d.getUTCFullYear() === this.currentYear) {
        const day = d.getUTCDate();
        if (!eventsByDay[day]) eventsByDay[day] = [];
        eventsByDay[day].push(ev);
      }
    }

    let cells = [];
    for (let i = 0; i < startDow; i++) {
      cells.push('<div class="min-h-[88px]"></div>');
    }
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === todayDay && this.currentMonth === todayMonth && this.currentYear === todayYear;
      const dayEvents = eventsByDay[day] || [];
      const eventDots = dayEvents.slice(0, 3).map(ev => {
        const colorClass = typeColors[ev.type] || 'bg-outline/20 text-on-surface border-outline/20';
        return `<button id="cal-event-${ev.id}" class="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${colorClass} hover:opacity-80 transition-opacity" onclick="CalendarView.selectEvent('${ev.id}'); event.stopPropagation();" title="${ev.title}">${ev.title}</button>`;
      }).join('');
      const moreLabel = dayEvents.length > 3
        ? `<span class="text-[9px] text-on-surface-variant pl-1">+${dayEvents.length - 3} more</span>` : '';
      cells.push(`<div class="min-h-[88px] p-1.5 rounded-lg border ${isToday ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:bg-surface-container-low'} transition-colors cursor-pointer flex flex-col gap-0.5" onclick="CalendarView.selectDay(${day})"><span class="text-xs font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'} self-end">${day}</span><div class="flex flex-col gap-0.5">${eventDots}${moreLabel}</div></div>`);
    }

    const upcomingEvents = [...allEvents]
      .filter(ev => new Date(ev.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 6);

    const upcomingHtml = upcomingEvents.length === 0
      ? '<p class="text-xs text-on-surface-variant italic">No upcoming events found.</p>'
      : upcomingEvents.map(ev => {
          const d = new Date(ev.startDate);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
          const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
          const colorClass = typeColors[ev.type] || 'bg-outline/20 text-on-surface border-outline/20';
          const isSelected = ev.id === this.selectedEventId;
          return `<button id="upcoming-event-${ev.id}" onclick="CalendarView.selectEvent('${ev.id}')" class="w-full text-left p-3 rounded-lg border transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/40'}"><div class="flex items-start gap-2"><span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${colorClass} shrink-0 mt-0.5">${ev.type}</span><div class="flex-1 min-w-0"><p class="text-xs font-semibold text-on-surface truncate">${ev.title}</p><p class="text-[10px] text-on-surface-variant">${dateStr} · ${timeStr} UTC</p><p class="text-[10px] text-on-surface-variant truncate">${ev.organizerName}</p></div></div></button>`;
        }).join('');

    const detailHtml = selectedEvent ? (() => {
      const sd = new Date(selectedEvent.startDate);
      const ed = new Date(selectedEvent.endDate);
      const dateFmt = { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
      const timeFmt = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
      const colorClass = typeColors[selectedEvent.type] || 'bg-outline/20 text-on-surface border-outline/20';
      const statusBadge = selectedEvent.status === 'Completed' ? 'bg-outline/20 text-on-surface-variant' : selectedEvent.status === 'Cancelled' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary';
      const isOrganizer = user.id === selectedEvent.organizerId;
      return `<div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col gap-4"><div class="flex items-start justify-between gap-3"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1 flex-wrap"><span class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${colorClass}">${selectedEvent.type}</span><span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge}">${selectedEvent.status}</span></div><h2 class="font-title-lg text-title-lg font-bold text-on-surface leading-tight">${selectedEvent.title}</h2></div><button id="close-event-detail-btn" onclick="CalendarView.clearSelection()" class="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">close</span></button></div><div class="grid grid-cols-1 gap-2 text-sm"><div class="flex items-start gap-2"><span class="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5">schedule</span><div><p class="font-semibold text-on-surface">${sd.toLocaleDateString('en-US', dateFmt)}</p><p class="text-xs text-on-surface-variant">${sd.toLocaleTimeString('en-US', timeFmt)} – ${ed.toLocaleTimeString('en-US', timeFmt)} UTC</p></div></div><div class="flex items-start gap-2"><span class="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5">location_on</span><p class="text-on-surface">${selectedEvent.location}</p></div><div class="flex items-start gap-2"><span class="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5">person</span><div><p class="text-on-surface font-medium">${selectedEvent.organizerName}</p><p class="text-xs text-on-surface-variant">Organizer${isOrganizer ? ' (You)' : ''}</p></div></div><div class="flex items-start gap-2"><span class="material-symbols-outlined text-[16px] text-on-surface-variant mt-0.5">group</span><p class="text-on-surface text-xs">${selectedEvent.attendees.length} attendee${selectedEvent.attendees.length !== 1 ? 's' : ''}</p></div></div><div class="pt-2 border-t border-outline-variant/20"><p class="text-xs text-on-surface-variant leading-relaxed">${selectedEvent.description}</p></div><div class="flex items-center gap-2 pt-1"><a href="${selectedEvent.meetingLink}" target="_blank" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-on-primary-fixed-variant transition-all"><span class="material-symbols-outlined text-[14px]">videocam</span>Join Meeting</a><button id="edit-event-btn-${selectedEvent.id}" onclick="CalendarView.openEditModal('${selectedEvent.id}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface text-xs font-semibold hover:border-primary/40 transition-all"><span class="material-symbols-outlined text-[14px]">edit</span>Edit Event</button></div></div>`;
    })() : '<div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col items-center justify-center gap-3 min-h-[200px]"><span class="material-symbols-outlined text-[36px] text-on-surface-variant/40">event_note</span><p class="text-sm text-on-surface-variant text-center">Select an event to view details</p></div>';

    return `<div class="space-y-6" id="calendar-view-root">
      <div id="edit-event-modal" class="hidden fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-scrim/60 backdrop-blur-sm" onclick="CalendarView.closeEditModal()"></div>
        <div class="relative z-10 w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low">
            <div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[22px]">edit_calendar</span><h2 class="font-title-md text-title-md font-bold text-on-surface">Edit Event Details</h2></div>
            <button id="close-edit-modal-btn" onclick="CalendarView.closeEditModal()" class="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"><span class="material-symbols-outlined text-[20px]">close</span></button>
          </div>
          <form id="edit-event-form" onsubmit="CalendarView.submitEditEvent(event)" class="px-6 py-5 space-y-4">
            <input type="hidden" id="edit-event-id" value="" />
            <div><label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Event Title</label><input id="edit-event-title" type="text" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary" required /></div>
            <div><label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Location</label><input id="edit-event-location" type="text" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary" /></div>
            <div><label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Meeting Link</label><input id="edit-event-link" type="url" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary" placeholder="https://..." /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Start (UTC)</label><input id="edit-event-start" type="datetime-local" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary" /></div>
              <div><label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">End (UTC)</label><input id="edit-event-end" type="datetime-local" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary" /></div>
            </div>
            <div><label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Description</label><textarea id="edit-event-desc" rows="3" class="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"></textarea></div>
            <div class="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
              <button type="button" onclick="CalendarView.closeEditModal()" class="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container-low transition-all">Cancel</button>
              <button id="edit-event-submit-btn" type="submit" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-on-primary-fixed-variant transition-all flex items-center gap-2"><span class="material-symbols-outlined text-[14px]">save</span>Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><div class="flex items-center gap-2 mb-1"><span class="material-symbols-outlined text-primary text-[28px]">calendar_month</span><h1 class="font-headline-md text-headline-md font-bold text-on-surface">Corporate Calendar</h1></div><p class="text-sm text-on-surface-variant">Company meetings, all-hands, project milestones, and team events.</p></div>
        <div class="flex items-center gap-2"><button id="cal-prev-month-btn" onclick="CalendarView.prevMonth()" class="p-2 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low transition-all text-on-surface-variant"><span class="material-symbols-outlined text-[20px]">chevron_left</span></button><span class="px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-sm font-semibold text-on-surface min-w-[160px] text-center">${monthName}</span><button id="cal-next-month-btn" onclick="CalendarView.nextMonth()" class="p-2 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low transition-all text-on-surface-variant"><span class="material-symbols-outlined text-[20px]">chevron_right</span></button></div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div class="grid grid-cols-7 border-b border-outline-variant/20">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="py-2 text-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">${d}</div>`).join('')}</div>
          <div class="grid grid-cols-7 gap-px bg-outline-variant/10 p-2">${cells.join('')}</div>
        </div>
        <div class="flex flex-col gap-4">
          ${detailHtml}
          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
            <div class="flex items-center gap-2 mb-3"><span class="material-symbols-outlined text-[18px] text-primary">upcoming</span><h3 class="text-sm font-bold text-on-surface">Upcoming Events</h3></div>
            <div class="flex flex-col gap-2">${upcomingHtml}</div>
          </div>
        </div>
      </div>
    </div>`;
  },

  selectEvent(eventId) {
    this.selectedEventId = eventId;
    AppRouter.renderCurrentRoute('calendar', State.user);
  },

  clearSelection() {
    this.selectedEventId = null;
    AppRouter.renderCurrentRoute('calendar', State.user);
  },

  selectDay(day) {
    const evOnDay = this.events.filter(ev => {
      const evd = new Date(ev.startDate);
      return evd.getUTCDate() === day && evd.getUTCMonth() + 1 === this.currentMonth;
    });
    if (evOnDay.length > 0) this.selectEvent(evOnDay[0].id);
  },

  prevMonth() {
    if (this.currentMonth === 1) { this.currentMonth = 12; this.currentYear--; }
    else { this.currentMonth--; }
    this.selectedEventId = null;
    AppRouter.renderCurrentRoute('calendar', State.user);
  },

  nextMonth() {
    if (this.currentMonth === 12) { this.currentMonth = 1; this.currentYear++; }
    else { this.currentMonth++; }
    this.selectedEventId = null;
    AppRouter.renderCurrentRoute('calendar', State.user);
  },

  openEditModal(eventId) {
    State.apiFetch(`/api/events/${eventId}`).then(res => {
      const ev = res.event;
      if (!ev) return;
      document.getElementById('edit-event-id').value = ev.id;
      document.getElementById('edit-event-title').value = ev.title || '';
      document.getElementById('edit-event-location').value = ev.location || '';
      document.getElementById('edit-event-link').value = ev.meetingLink || '';
      document.getElementById('edit-event-desc').value = ev.description || '';
      const toLocal = iso => iso ? iso.slice(0, 16) : '';
      document.getElementById('edit-event-start').value = toLocal(ev.startDate);
      document.getElementById('edit-event-end').value = toLocal(ev.endDate);
      const modal = document.getElementById('edit-event-modal');
      if (modal) modal.classList.remove('hidden');
    }).catch(() => State.showToast('Failed to load event details', 'error'));
  },

  closeEditModal() {
    const modal = document.getElementById('edit-event-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitEditEvent(event) {
    event.preventDefault();
    const eventId = document.getElementById('edit-event-id').value;
    const title = document.getElementById('edit-event-title').value.trim();
    const location = document.getElementById('edit-event-location').value.trim();
    const meetingLink = document.getElementById('edit-event-link').value.trim();
    const description = document.getElementById('edit-event-desc').value.trim();
    const startRaw = document.getElementById('edit-event-start').value;
    const endRaw = document.getElementById('edit-event-end').value;
    if (!title) { State.showToast('Event title is required', 'error'); return; }
    const payload = {
      title,
      ...(location && { location }),
      ...(meetingLink && { meetingLink }),
      ...(description && { description }),
      ...(startRaw && { startDate: new Date(startRaw).toISOString() }),
      ...(endRaw && { endDate: new Date(endRaw).toISOString() }),
    };
    try {
      const res = await State.apiFetch(`/api/events/${eventId}`, { method: 'PUT', body: JSON.stringify(payload) });
      State.showToast(res.message || 'Event updated successfully', 'check_circle');
      this.closeEditModal();
      AppRouter.renderCurrentRoute('calendar', State.user);
    } catch (err) {
      State.showToast(err.message || 'Failed to update event', 'error');
    }
  }
};

window.CalendarView = CalendarView;
