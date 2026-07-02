export type CourseIconType =
	| 'administrativo'
	| 'varejo'
	| 'contact-center'
	| 'teleprocessamento'
	| 'producao'
	| 'saude'
	| 'alimentacao'
	| 'manutencao'
	| 'frentista'
	| 'telecom'
	| 'jardineiro';

export function getCourseIconType(imageKey: string): CourseIconType {
	if (imageKey.startsWith('adm')) return 'administrativo';
	if (imageKey.startsWith('varejo')) return 'varejo';
	if (imageKey.startsWith('contact')) return 'contact-center';
	if (imageKey.startsWith('teleprocess')) return 'teleprocessamento';
	if (imageKey.startsWith('producao')) return 'producao';
	if (imageKey.startsWith('saude')) return 'saude';
	if (imageKey.startsWith('alimentacao')) return 'alimentacao';
	if (imageKey.startsWith('manutencao')) return 'manutencao';
	if (imageKey.startsWith('frentista')) return 'frentista';
	if (imageKey.startsWith('telecom')) return 'telecom';
	if (imageKey.startsWith('jardineiro')) return 'jardineiro';
	return 'administrativo';
}

export const courseIconLabels: Record<CourseIconType, string> = {
	administrativo: 'Ícone de serviços administrativos',
	'contact-center': 'Ícone de contact center',
	varejo: 'Ícone de comércio e varejo',
	teleprocessamento: 'Ícone de redes e teleprocessamento',
	producao: 'Ícone de produção industrial',
	saude: 'Ícone de saúde e farmácia',
	alimentacao: 'Ícone de alimentação',
	manutencao: 'Ícone de manutenção',
	frentista: 'Ícone de frentista',
	telecom: 'Ícone de telecomunicações',
	jardineiro: 'Ícone de jardinagem e meio ambiente',
};
