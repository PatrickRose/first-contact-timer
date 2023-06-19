import "../styles/globals.css";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body id="__next">{children}</body>
        </html>
    );
}
