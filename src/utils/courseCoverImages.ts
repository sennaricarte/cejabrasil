import type { ImageMetadata } from 'astro';
import admHero from '../assets/courses/adm-hero.png';
import adm4Hero from '../assets/courses/adm4-hero.png';
import alimentacaoHero from '../assets/courses/alimentacao-hero.png';
import farmaciaHero from '../assets/courses/farmacia-hero.png';
import frentistaHero from '../assets/courses/frentista-hero.png';
import jardineiroHero from '../assets/courses/jardineiro-hero.png';
import manutencaoHero from '../assets/courses/manutencao-hero.png';
import producaoHero from '../assets/courses/producao-hero.png';
import telecomHero from '../assets/courses/telecom-hero.png';
import telematicaHero from '../assets/courses/telematica-hero.png';
import telematica6Hero from '../assets/courses/telematica6-hero.png';
import tiHero from '../assets/courses/ti-hero.png';
import varejoHero from '../assets/courses/varejo-hero.png';

export const courseCoverImages: Partial<Record<string, ImageMetadata>> = {
	adm: admHero,
	'adm-4h': adm4Hero,
	alimentacao: alimentacaoHero,
	farmacia: farmaciaHero,
	frentista: frentistaHero,
	jardineiro: jardineiroHero,
	manutencao: manutencaoHero,
	producao: producaoHero,
	telecom: telecomHero,
	telematica: telematicaHero,
	'telematica-6h': telematica6Hero,
	ti: tiHero,
	varejo: varejoHero,
};
