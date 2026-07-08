import type { ImageMetadata } from 'astro';
import alimentacaoHero from '../assets/courses/alimentacao-hero.png';
import farmaciaHero from '../assets/courses/farmacia-hero.png';
import frentistaHero from '../assets/courses/frentista-hero.png';
import jardineiroHero from '../assets/courses/jardineiro-hero.png';
import manutencaoHero from '../assets/courses/manutencao-hero.png';
import producaoHero from '../assets/courses/producao-hero.png';
import telecomHero from '../assets/courses/telecom-hero.png';

export const courseCoverImages: Partial<Record<string, ImageMetadata>> = {
	alimentacao: alimentacaoHero,
	farmacia: farmaciaHero,
	frentista: frentistaHero,
	jardineiro: jardineiroHero,
	manutencao: manutencaoHero,
	producao: producaoHero,
	telecom: telecomHero,
};
