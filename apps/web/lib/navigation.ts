// Navigation compatibility layer
// Replaces react-router-dom hooks with Next.js equivalents
export {
  useRouter,
  useParams,
  usePathname,
  useSearchParams,
} from "next/navigation";

export { default as Link } from "next/link";
