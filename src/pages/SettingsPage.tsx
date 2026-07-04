import { Button } from '../components/ui/Button';
import { db } from '../db/database';
import { useToastStore } from '../store/useToastStore';
import { Database, Download, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useToastStore();

  const handleExportData = async () => {
    try {
      const ledger = await db.ledger.toArray();
      const products = await db.products.toArray();
      const sales = await db.sales.toArray();
      
      const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: { ledger, products, sales }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jaifon_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      addToast('Backup exportado correctamente', 'success');
    } catch (error) {
      addToast('Error al exportar datos', 'error');
    }
  };

  const handleResetData = async () => {
    if (window.confirm("¿ESTÁS SEGURO? Esta acción borrará TODO tu inventario, ventas y dinero en caja para siempre.")) {
      try {
        await db.transaction('rw', db.ledger, db.products, db.sales, async () => {
          await db.ledger.clear();
          await db.products.clear();
          await db.sales.clear();
        });
        addToast('Todos los datos han sido borrados', 'success');
      } catch (error) {
        addToast('Error al borrar los datos', 'error');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ajustes y Sistema</h1>
        <p className="text-slate-500 text-sm mt-1">Configuraciones por defecto y gestión de tu base de datos local.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-brand-100 text-brand-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Base de Datos Offline (Dexie.js)</h2>
            <p className="text-sm text-slate-500">Toda tu información se guarda en la memoria de este dispositivo (navegador). No usamos servidores externos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700">Exportar Copia de Seguridad</h3>
            <p className="text-sm text-slate-500 mb-2">Descarga toda tu contabilidad en formato JSON para que puedas restaurarla o guardarla a salvo.</p>
            <Button variant="secondary" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" /> Descargar Backup (JSON)
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-rose-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Zona de Peligro</h3>
            <p className="text-sm text-slate-500 mb-2">Si necesitas empezar de cero. Esto no se puede deshacer a menos que tengas un backup.</p>
            <Button variant="danger" onClick={handleResetData}>
              Borrar toda la Base de Datos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
