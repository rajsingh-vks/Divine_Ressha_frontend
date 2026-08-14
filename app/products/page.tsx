import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductsPageClient from '../components/ProductsPageClient';
import { getProducts } from '@/lib/data/products';

export const metadata: Metadata = {
    title: 'Products | Divine Ressha',
    description: 'Explore Divine Ressha products.',
};

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <>
            <Header />
            <ProductsPageClient products={products} />
            <Footer />
        </>
    );
}
