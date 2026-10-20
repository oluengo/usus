/* ---------- Iconos ---------- */
const ICON = {
  train: '<svg viewBox="0 0 24 24"><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/></svg>',
  routines: '<svg viewBox="0 0 24 24"><path d="M4 4h4v16H4zM10 4h4v16h-4zM15.5 5.2l3.9-1 3.6 14.5-3.9 1z"/></svg>',
  diary: '<svg viewBox="0 0 24 24"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6zM6 3v18M10 8h5M10 12h5"/></svg>',
  history: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  stats: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  data: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};
const QICO = {
  list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  free: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  act: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8"/><path d="M7 21l3-6 3 2v5M10 15l1-5-3 1-2 3M11 10l3 2 3-1"/></svg>'
};
const MORE_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>';
const PRINT_ICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><path d="M6 14h12v7H6z"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5l10 6.5-10 6.5z"/></svg>';

function renderTabs() {
  const items = [["train",T("Hoy")],["routines",T("Biblioteca")],["diary",T("Diario")],["stats",T("Progreso")],["data",T("Ajustes")]];
  $("#tabs").innerHTML = items.map(([k, l]) =>
    `<button data-tab="${k}" ${state.tab === k ? 'aria-current="page"' : ""}>${ICON[k]}<span>${l}</span></button>`).join("");
}

function render() {
  renderTabs(); syncAwake();
  if (state.tab === "history") state.tab = "diary";
  const v = state.actForm ? viewActForm : state.tab === "data" && state.link ? viewLink : { train: viewTrain, routines: viewRoutines, diary: viewDiary, stats: viewStats, data: viewData }[state.tab];
  const mb = document.querySelector(".mbox.dsh"), mbTop = mb ? mb.scrollTop : 0;
  $("#app").innerHTML = v() + focusView() + welcomeModal() + noticeModal() + planWeekModal() + planMenuModal() + newsModal() + cycAckModal() + savedModal() + shareSessModal() + shareRoutModal() + incomingModal() + profPickModal() + profFormModal() + profEditModal() + profCopyModal() + issueModal() + exInfoModal() + xpickModal() + ownMatModal() + catAskModal() + progChangeModal() + aiModal() + csvModal() + swapModal() + dayNoteModal();
  if (mb) { const nb = document.querySelector(".mbox.dsh"); if (nb) nb.scrollTop = mbTop; }
  if (state.tab === "train" && state.active && !state.actForm) tick();
  if (state.shareSess && SHOPT().img) sessPreview();
  document.body.classList.toggle("edw", state.tab === "routines" && !!state.editing && !state.print);
  document.body.classList.toggle("rtw", state.tab === "routines" && !state.editing && !state.print);
  document.body.classList.toggle("stw", state.tab === "data" && !state.link);
  if (state.print) fitPrint();
}

