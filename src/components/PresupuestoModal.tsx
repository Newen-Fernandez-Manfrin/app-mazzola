import React, { useState } from 'react';
import { 
  Printer, 
  FileDown, 
  Eye, 
  EyeOff, 
  X, 
  Check, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Layers,
  Hammer
} from 'lucide-react';
import { Presupuesto } from '../types';

interface PresupuestoModalProps {
  presupuesto: Presupuesto | null;
  onCerrar: () => void;
  onCambiarEstado: (id: string, nuevoEstado: Presupuesto['estado']) => void;
  onVerEnFabrica?: (presupuesto: Presupuesto) => void;
}

export const PresupuestoModal: React.FC<PresupuestoModalProps> = ({
  presupuesto,
  onCerrar,
  onCambiarEstado,
  onVerEnFabrica
}) => {
  // Toggle between Vista Cliente (strictly clean, no internal costs/margins) and Vista Interna Mazzola
  const [modoInterno, setModoInterno] = useState<boolean>(false);

  if (!presupuesto) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    // Generate clean HTML formatted document for Microsoft Word
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Presupuesto ${presupuesto.numero} - Aberturas Mazzola</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; }
          .header { text-align: left; border-bottom: 2px solid #EA580C; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 18pt; font-weight: bold; color: #D97706; }
          .subtitle { font-size: 10pt; color: #555; }
          .info-box { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; background: #fdfdfd; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f4f1ea; border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 10pt; }
          td { border: 1px solid #ccc; padding: 8px; font-size: 10pt; }
          .total { font-size: 14pt; font-weight: bold; color: #111; text-align: right; margin-top: 20px; }
          .notes { font-size: 9pt; color: #666; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ABERTURAS MAZZOLA</div>
          <div class="subtitle">Fabricación a medida · Carpintería de Aluminio</div>
        </div>
        <div class="info-box">
          <strong>PRESUPUESTO:</strong> ${presupuesto.numero}<br/>
          <strong>Fecha:</strong> ${new Date(presupuesto.fechaCreacion).toLocaleDateString('es-AR')}<br/>
          <strong>Cliente:</strong> ${presupuesto.clienteNombre}<br/>
          ${presupuesto.clienteTelefono ? `<strong>Teléfono:</strong> ${presupuesto.clienteTelefono}<br/>` : ''}
          ${presupuesto.clienteDireccion ? `<strong>Dirección:</strong> ${presupuesto.clienteDireccion}<br/>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Tipología / Abertura</th>
              <th>Medidas (Ancho x Alto)</th>
              <th>Vidrio</th>
              <th>Accesorios Incluidos</th>
              <th>Precio Total</th>
            </tr>
          </thead>
          <tbody>
            ${(presupuesto?.items || []).map(it => {
              if (!it) return '';
              const acc = it.accesorios || {};
              return `
              <tr>
                <td><strong>${it.cantidad || 1}</strong></td>
                <td><strong>${it.tipologia || 'Abertura'}</strong>${it.linea ? ` (${it.linea})` : ''}</td>
                <td><strong>${it.anchoMm || 0} x ${it.altoMm || 0} mm</strong></td>
                <td>${it.vidrio || 'Simple'}</td>
                <td>
                  ${[
                    acc.mosquitero ? 'Mosquitero' : null,
                    acc.reja ? 'Reja' : null,
                    acc.transporte ? 'Transporte' : null,
                    acc.instalacion ? 'Instalación' : null,
                    acc.otros ? acc.otros : null
                  ].filter(Boolean).join(', ') || 'Estándar'}
                </td>
                <td style="text-align: right;"><strong>$ ${(it.precioTotalItem || 0).toLocaleString('es-AR')}</strong></td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        <div class="total">
          TOTAL PRESUPUESTADO: $ ${(presupuesto.total || 0).toLocaleString('es-AR')}
        </div>
        <div class="notes">
          <strong>Condiciones y Notas:</strong><br/>
          ${presupuesto.notas || 'Presupuesto válido por 10 días hábiles. Precios con seña del 50% para congelar valores de fabricación.'}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Presupuesto_${presupuesto.numero}_Mazzola.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div 
        id="modal-presupuesto-detalle"
        className="bg-[#F8F6F1] border border-[#D5CEC2] w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden print-container print:border-none print:shadow-none print:max-w-none"
      >
        {/* Barra superior de acciones (no imprimible) */}
        <div className="bg-[#DFD8CC] px-5 py-3.5 border-b border-[#CCC4B4] flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-900 text-sm">
              Presupuesto {presupuesto.numero}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              presupuesto.estado === 'Aprobado' ? 'bg-emerald-200 text-emerald-900' :
              presupuesto.estado === 'En Fabricación' ? 'bg-amber-200 text-amber-900' :
              'bg-stone-300 text-stone-800'
            }`}>
              {presupuesto.estado}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Modo Interno / Vista Cliente */}
            <button
              onClick={() => setModoInterno(!modoInterno)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                modoInterno 
                  ? 'bg-amber-600 text-white border-amber-700' 
                  : 'bg-[#EDE8DE] text-stone-800 border-[#C5BDAE] hover:bg-[#E4DDCF]'
              }`}
              title="Separación de datos: Vista para cliente vs Vista interna para personal de Mazzola"
            >
              {modoInterno ? <Eye size={14} /> : <EyeOff size={14} />}
              {modoInterno ? 'Vista Interna Taller (Con costos)' : 'Vista Cliente (Limpia)'}
            </button>

            {/* Imprimir / Guardar como PDF */}
            <button
              id="btn-imprimir-presupuesto"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={14} />
              Imprimir / PDF
            </button>

            {/* Exportar Word */}
            <button
              id="btn-exportar-word"
              onClick={handleExportWord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FileDown size={14} />
              Exportar Word (.doc)
            </button>

            {/* Ver en Fábrica */}
            {onVerEnFabrica && (
              <button
                id="btn-ver-en-fabrica"
                onClick={() => {
                  onCerrar();
                  onVerEnFabrica(presupuesto);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Abrir en módulo de Fábrica y evaluar orden de producción"
              >
                <Hammer size={14} />
                Ver en Fábrica
              </button>
            )}

            <button
              onClick={onCerrar}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-300 transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* DOCUMENTO DEL PRESUPUESTO (Área Imprimible) */}
        <div className="p-6 sm:p-8 bg-[#FAF8F5] print:p-4 text-stone-900">
          {/* Cabecera Mazzola */}
          <div className="flex items-start justify-between border-b-2 border-orange-500 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-2xl shadow-xs print:border print:border-orange-500">
                M
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-2xl text-stone-900 tracking-tight">ABERTURAS</span>
                  <span className="font-black text-2xl text-orange-600">MAZZOLA</span>
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  Fabricación a medida · Ventanas, Puertas, Paños Fijos y Mosquiteros
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-orange-800 uppercase tracking-widest">
                Presupuesto Oficial
              </div>
              <div className="text-xl sm:text-2xl font-black text-stone-900">
                {presupuesto.numero}
              </div>
              <div className="text-xs text-stone-600 flex items-center justify-end gap-1 mt-0.5">
                <Calendar size={12} />
                Fecha: {new Date(presupuesto.fechaCreacion).toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="bg-[#F2EFE8] print:bg-stone-50 border border-[#DBD5C8] rounded-xl p-4 mb-6">
            <h4 className="text-xs font-extrabold text-stone-600 uppercase tracking-wider mb-2">
              Datos del Cliente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <User size={14} className="text-orange-700" />
                <div>
                  <span className="text-stone-500 block text-[10px]">Cliente / Obra</span>
                  <span className="font-bold text-stone-900 text-sm">{presupuesto.clienteNombre}</span>
                </div>
              </div>

              {presupuesto.clienteTelefono && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-orange-700" />
                  <div>
                    <span className="text-stone-500 block text-[10px]">Teléfono de contacto</span>
                    <span className="font-semibold text-stone-800">{presupuesto.clienteTelefono}</span>
                  </div>
                </div>
              )}

              {presupuesto.clienteDireccion && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-orange-700" />
                  <div>
                    <span className="text-stone-500 block text-[10px]">Dirección / Entrega</span>
                    <span className="font-semibold text-stone-800">{presupuesto.clienteDireccion}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Aberturas / Ítems independientes */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#DBD5C8] rounded-lg overflow-hidden">
              <thead className="bg-[#E9E4D8] border-b border-[#D5CEC2] text-stone-800 font-extrabold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Cant.</th>
                  <th className="py-2.5 px-3">Tipología de Abertura</th>
                  <th className="py-2.5 px-3 text-center">Medidas (mm)</th>
                  <th className="py-2.5 px-3">Vidrio</th>
                  <th className="py-2.5 px-3">Accesorios / Detalles</th>
                  <th className="py-2.5 px-3 text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1D4] bg-[#FAF8F5]">
                {(presupuesto?.items || []).map((item, idx) => {
                  if (!item) return null;
                  const acc = item.accesorios || {};
                  const accesoriosLista: string[] = [];
                  if (acc.mosquitero) accesoriosLista.push('Mosquitero');
                  if (acc.reja) accesoriosLista.push('Reja');
                  if (acc.transporte) accesoriosLista.push('Transporte');
                  if (acc.instalacion) accesoriosLista.push('Instalación');
                  if (acc.otros) accesoriosLista.push(acc.otros);

                  return (
                    <tr key={item.id || idx} className="hover:bg-amber-50/30">
                      <td className="py-3 px-3 font-black text-center text-sm text-stone-900">
                        {item.cantidad}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-stone-900 text-sm">
                          {item.tipologia}
                        </div>
                        {item.linea && (
                          <div className="text-[11px] text-stone-600 font-medium">
                            {item.linea} {item.color ? `· Color: ${item.color}` : ''}
                          </div>
                        )}
                        {item.notasItem && (
                          <div className="text-[11px] text-stone-500 italic mt-0.5">
                            {item.notasItem}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-stone-900 bg-[#EFECE4] px-2 py-1 rounded text-xs inline-block">
                          {item.anchoMm} x {item.altoMm} mm
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-800">
                        {item.vidrio}
                      </td>
                      <td className="py-3 px-3">
                        {accesoriosLista.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {accesoriosLista.map((acc, aIdx) => (
                              <span key={aIdx} className="bg-stone-200/80 text-stone-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                {acc}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">Sin accesorios</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-stone-900 text-sm">
                        ${(item.precioTotalItem || 0).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales y notas */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            <div className="flex-1 text-xs text-stone-600 bg-[#F4F1EA] p-3.5 rounded-xl border border-[#DBD5C8]">
              <span className="font-bold text-stone-800 block mb-1">Notas y Condiciones:</span>
              <p className="whitespace-pre-line leading-relaxed">
                {presupuesto.notas || 'Presupuesto confeccionado con precios fijados manualmente. Válido por 10 días corridos a partir de la fecha de emisión.'}
              </p>
            </div>

            <div className="w-full sm:w-72 bg-[#EFECE4] border border-[#D5CEC2] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-stone-700">
                <span>Subtotal aberturas:</span>
                <span className="font-bold">${(presupuesto.subtotal || 0).toLocaleString('es-AR')}</span>
              </div>

              {Boolean(presupuesto.descuentoManual) && (
                <div className="flex justify-between text-xs text-emerald-800 font-semibold">
                  <span>Bonificación manual:</span>
                  <span>- ${(presupuesto.descuentoManual || 0).toLocaleString('es-AR')}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-orange-500 flex justify-between items-baseline">
                <span className="font-black text-stone-900 text-sm">TOTAL FINAL:</span>
                <span className="font-black text-orange-700 text-xl">
                  ${(presupuesto.total || 0).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          {/* Información interna de Mazzola (SÓLO en modo interno, NUNCA visible para el cliente) */}
          {modoInterno && (
            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-xs no-print">
              <div className="flex items-center gap-2 font-black text-amber-900 mb-2">
                <Layers size={16} />
                <span>INFORMACIÓN INTERNA EXCLUSIVA DEL TALLER (NO VISIBLE AL CLIENTE)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-stone-800">
                <div>
                  <span className="text-stone-500 block">Costo Interno Estimado:</span>
                  <span className="font-bold text-sm">
                    ${(presupuesto.costoEstimadoInterno || 0).toLocaleString('es-AR')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Margen / Ganancia Bruta:</span>
                  <span className="font-bold text-sm text-emerald-800">
                    ${((presupuesto.total || 0) - (presupuesto.costoEstimadoInterno || 0)).toLocaleString('es-AR')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Registrado por:</span>
                  <span className="font-semibold">{presupuesto.creadoPor}</span>
                </div>
              </div>
            </div>
          )}

          {/* REGLA DEL PROYECTO: "NO agregar firma de Mazzola automáticamente." */}
          {/* Se deja espacio limpio o aclaración sin firma automática */}
        </div>

        {/* Footer del Modal */}
        <div className="bg-[#EAE5DC] px-5 py-3 border-t border-[#D5CEC2] flex items-center justify-between no-print text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-600 font-medium">Cambiar estado del presupuesto:</span>
            <select
              value={presupuesto.estado}
              onChange={(e) => onCambiarEstado(presupuesto.id, e.target.value as any)}
              className="bg-[#F8F6F1] font-bold text-stone-900 border border-[#CCC4B4] rounded px-2 py-1 outline-none"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado (Pasa a Fábrica)</option>
              <option value="En Fabricación">En Fabricación</option>
              <option value="Entregado">Entregado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          <button
            onClick={onCerrar}
            className="px-4 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-800 text-stone-100 font-bold"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
};
