import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { ToolPalette } from './components/ToolPalette';
import { CueTypePalette } from './components/CueTypePalette';
import { CueTypeManager } from './components/CueTypeManager';
import { CueInspector } from './components/CueInspector';
import { CueListPanel } from './components/CueListPanel';
import { PageNavigator } from './components/PageNavigator';
import { PdfCanvas } from './components/PdfCanvas';
import { useStore } from './store';
import './App.css';

export default function App() {
  const cueTypes = useStore(s => s.cueTypes);
  const setActiveTypeId = useStore(s => s.setActiveTypeId);
  const selectCue = useStore(s => s.selectCue);
  const selected = useStore(s => s.selected);
  const nextPage = useStore(s => s.nextPage);
  const prevPage = useStore(s => s.prevPage);
  const requestNoteFocus = useStore(s => s.requestNoteFocus);
  const nudgeSelected = useStore(s => s.nudgeSelected);
  const deleteSelected = useStore(s => s.deleteSelected);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;
      if (isEditable) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPage();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
        return;
      }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && selected) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        nudgeSelected(e.key === 'ArrowUp' ? -step : step);
        return;
      }
      if (e.key === 'Enter' && selected) {
        e.preventDefault();
        requestNoteFocus();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key === 'Escape') {
        selectCue(null);
        return;
      }
      const lower = e.key.toLowerCase();
      const t = cueTypes.find(t => t.shortcut === lower);
      if (t) setActiveTypeId(t.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cueTypes, setActiveTypeId, selectCue, selected, nextPage, prevPage, requestNoteFocus, nudgeSelected, deleteSelected]);

  return (
    <div className="app">
      <Toolbar />
      <div className="body">
        <aside className="sidebar">
          <ToolPalette />
          <CueTypePalette />
          <CueTypeManager />
          <CueInspector />
          <CueListPanel />
        </aside>
        <main className="main">
          <PageNavigator />
          <PdfCanvas />
        </main>
      </div>
    </div>
  );
}
