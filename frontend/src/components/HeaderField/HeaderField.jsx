"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./HeaderField.module.scss";

export default function HeaderField() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const urlQuery = searchParams.get("search") ?? "";

    const [value, setValue] = useState(urlQuery);

    useEffect(() => {
        setValue(urlQuery);
    }, [urlQuery]);

    function goToCatalog(query) {
        const url = query
        ? `/catalog?search=${encodeURIComponent(query)}`
        : "/catalog";

        if (pathname === "/catalog") {
        router.replace(url); 
        } else {
        router.push(url); 
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        goToCatalog(value.trim());
    }

    return (
        <form
            className={styles.headerField}
            onSubmit={handleSubmit}
            role="search"    
        >
            <button type="submit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#17191B" className="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                </svg>
            </button>
            <input 
                type="search" 
                placeholder="Search Cars"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-label="Search cars"
            />
        </form>
    )
}