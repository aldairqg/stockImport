import { Button } from '../components/ui/Button';
import { supabase } from '../db/database';
import { useToastStore } from '../store/useToastStore';
import { Database, Download, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { addToast } = useToastStore();

  const handleExportData = async () => {
    try {
      const [{ data: ledger }, { data: products }, { data: sales }] = await Promise.all([
        supabase.from('ledger').select('*').order('date', { ascending: true }),
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
      ]);

      const backupData = {
        version: 2,
        timestamp: new Date().toISOString(),
        data: { ledger, products, sales }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stockimport_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Backup exportado correctamente', 'success');
    } catch {
      addToast('Error al exportar datos', 'error');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('¿ESTÁS SEGURO? Esta acción borrará TODO tu inventario, ventas y caja. No se puede deshacer.')) {
      try {
        await Promise.all([
          supabase.from('sales').delete().neq('id', ''),
          supabase.from('ledger').delete().neq('id', ''),
          supabase.from('products').delete().neq('id', ''),
          supabase.from('simulations').delete().neq('id', ''),
        ]);
        addToast('Todos los datos han sido borrados', 'success');
      } catch {
        addToast('Error al borrar los datos', 'error');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ajustes y Sistema</h1>
        <p className="text-slate-500 text-sm mt-1">Gestión de datos y configuración del sistema.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-brand-100 text-brand-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Base de Datos (Supabase)</h2>
            <p className="text-sm text-slate-500">Tu información se sincroniza en la nube y es accesible desde cualquier dispositivo.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700">Exportar Copia de Seguridad</h3>
            <p className="text-sm text-slate-500">Descarga todos tus datos en formato JSON.</p>
            <Button variant="secondary" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" /> Descargar Backup (JSON)
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-rose-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Zona de Peligro</h3>
            <p className="text-sm text-slate-500">Borra todos los datos permanentemente. Asegúrate de tener un backup.</p>
            <Button variant="danger" onClick={handleResetData}>
              Borrar toda la Base de Datos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
