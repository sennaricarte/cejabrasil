import type { ImageMetadata } from 'astro';
import frentistaHero from '../assets/courses/frentista-hero.png';
import jardineiroHero from '../assets/courses/jardineiro-hero.png';
import telecomHero from '../assets/courses/telecom-hero.png';

export const courseCoverImages: Partial<Record<string, ImageMetadata>> = {
	frentista: frentistaHero,
	jardineiro: jardineiroHero,
	telecom: telecomHero,
};
