import type { Metadata } from "next";
import Image from "next/image";
import styles from "./links.module.css";
import Particles from "@/components/Particles";

export const metadata: Metadata = {
    title: "Escola do Milhão — Central de Acesso",
    description: "Acesse a página oficial, comunidade e conteúdos gratuitos da Escola do Milhão.",
    openGraph: {
        title: "Escola do Milhão — Central de Acesso",
        description: "Escolha seu caminho. Comunidade, conteúdos e treinamentos oficiais.",
        images: [{ url: "/images/vendas.png" }],
    },
};

export default function LinksPage() {
    return (
        <main className={styles.container}>
            <Particles />
            {/* Background Glows */}
            <div className="glow-container">
                <div className="glow-blob glow-1"></div>
                <div className="glow-blob glow-2"></div>
                <div className="glow-blob glow-3"></div>
            </div>

            <header className={styles.header}>
                <p className={styles.tagline}>Escola do Milhão • Central de Acesso</p>
                <div className={styles.socialRow}>
                    <a href="https://www.instagram.com/felipesouza.mkt/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                        <InstagramIcon />
                    </a>
                    <a href="https://www.tiktok.com/@felipesousza?_r=1&_t=ZS-93UGp2OspWv" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                        <TikTokIcon />
                    </a>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Card 1 - Vendas */}
                <div
                    className={`${styles.card} ${styles.cardVendas} ${styles.cardDisabled}`}
                >
                    <Image
                        src="/Escola.webp"
                        alt="Escola do Milhão"
                        fill
                        className={styles.banner}
                        priority
                    />
                    <div className={styles.overlay}></div>
                    <div className={styles.cardContent}>
                        <span className={`${styles.badge} ${styles.badgeEmBreve}`}>Em Breve</span>
                    </div>
                    <div className={styles.cta}>
                        <ArrowIcon />
                    </div>
                </div>

                {/* Card 2 - Discord */}
                <a
                    href="https://discord.gg/U22jUWWn"
                    className={`${styles.card} ${styles.cardDiscord}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        src="/discord.webp"
                        alt="Discord Community"
                        fill
                        className={styles.banner}
                    />
                    <div className={styles.overlay}></div>
                    <div className={styles.cardContent}>
                        <span className={`${styles.badge} ${styles.badgeDiscord}`}>Grátis</span>
                    </div>
                    <div className={styles.cta}>
                        <ArrowIcon />
                    </div>
                </a>

                {/* Card 3 - YouTube */}
                <a
                    href="https://youtu.be/XvjW05uKf-k?si=TWsNo6EGY-OUA87Z"
                    className={`${styles.card} ${styles.cardYoutube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        src="/youtube.webp"
                        alt="YouTube Channel"
                        fill
                        className={styles.banner}
                    />
                    <div className={styles.overlay}></div>
                    <div className={styles.cardContent}>
                        <span className={`${styles.badge} ${styles.badgeYoutube}`}>Vídeos</span>
                    </div>
                    <div className={styles.cta}>
                        <ArrowIcon />
                    </div>
                </a>
            </div>

            <footer className={styles.footer}>
                © {new Date().getFullYear()} Escola do Milhão. Todos os direitos reservados.
            </footer>
        </main>
    );
}

function InstagramIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
    );
}

function TikTokIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    );
}
