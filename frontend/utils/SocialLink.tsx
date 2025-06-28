interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

export default function SocialLink({
  href,
  icon,
  label,
  className = "", // default to empty string
}: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 hover:underline transition ${className}`}
    >
      {icon}
      {label}
    </a>
  );
}
