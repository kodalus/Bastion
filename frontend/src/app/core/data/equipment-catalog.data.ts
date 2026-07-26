import { EquipmentCategory } from '../models/equipment.model';

export interface CatalogEquipmentItem {
  name: string;
  category: EquipmentCategory;
  hint: string;
}

export const EQUIPMENT_CATALOG: CatalogEquipmentItem[] = [
  { name: 'Gaśnica proszkowa (ABC)', category: 'FireExtinguisher', hint: 'Pożary klasy A, B, C — do każdego pomieszczenia' },
  { name: 'Gaśnica CO₂', category: 'FireExtinguisher', hint: 'Urządzenia elektryczne i sprzęt RTV' },
  { name: 'Koc gaśniczy', category: 'FireExtinguisher', hint: 'Małe pożary i osoba z płonącą odzieżą' },
  { name: 'Apteczka domowa (duża)', category: 'FirstAid', hint: 'Pełny zestaw opatrunków i leków pierwszej pomocy' },
  { name: 'Agregat prądotwórczy', category: 'Generator', hint: 'Awaryjne źródło prądu na wypadek blackoutu' },
  { name: 'Powerbank stacjonarny (≥100Wh)', category: 'Generator', hint: 'Zasilanie laptopa i lamp LED przez kilka dni' },
  { name: 'Panel solarny z inverterem', category: 'Generator', hint: 'Odnawialne źródło energii niezależne od sieci' },
  { name: 'UPS', category: 'Generator', hint: 'Podtrzymanie routera i komputera przy przerwie' },
  { name: 'Radio kryzysowe (DAB+/FM)', category: 'Communication', hint: 'Alarmy RCB i komunikaty bez internetu' },
  { name: 'Walkie-talkie', category: 'Communication', hint: 'Łączność w obrębie kilku km bez infrastruktury' },
  { name: 'Radio CB', category: 'Communication', hint: 'Łączność na 27 MHz z kierowcami i służbami' },
  { name: 'Filtr do wody (grawitacyjny)', category: 'Filter', hint: 'Oczyszczanie wody bez pompy ani prądu' },
  { name: 'Pompka filtrująca (turystyczna)', category: 'Filter', hint: 'Filtrowanie wody ze strumienia lub jeziora' },
  { name: 'Łopata', category: 'Tools', hint: 'Odśnieżanie, kopanie, tłumienie ognia zewnętrznego' },
  { name: 'Siekiera', category: 'Tools', hint: 'Rąbanie drewna na opał i ewakuacja z zablokowanych pomieszczeń' },
  { name: 'Piła ręczna', category: 'Tools', hint: 'Cięcie drewna i usuwanie powałów bez prądu' },
  { name: 'Multitool', category: 'Tools', hint: 'Wielofunkcyjne narzędzie do napraw w terenie' },
  { name: 'Drabina składana', category: 'Tools', hint: 'Ewakuacja z górnych pięter i dostęp do dachu' },
  { name: 'Samochód', category: 'Vehicle', hint: 'Ewakuacja rodziny i transport zapasów' },
  { name: 'Rower', category: 'Vehicle', hint: 'Transport przy braku paliwa lub zablokowanych drogach' },
  { name: 'Czujnik dymu', category: 'Other', hint: 'Wczesne wykrycie pożaru — obowiązkowy w każdym pomieszczeniu' },
  { name: 'Czujnik tlenku węgla (CO)', category: 'Other', hint: 'Ochrona życia przy urządzeniach gazowych i kominku' },
  { name: 'Latarka czołowa', category: 'Other', hint: 'Obie ręce wolne przy pracy i ewakuacji po ciemku' },
];
