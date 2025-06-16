"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getSession } from "lib/session";
import { Role } from "lib/type";
import FilterBar from "@/app/components/admin/log/FilterBar";
import Pagination from "@/app/components/admin/log/Pagination";
import LogTable from "@/app/components/admin/log/LogTable";
import LogSummaryBar from "@/app/components/admin/log/LogSummeryBar";

export default function AdminLogPage() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<
    "all" | "create" | "update" | "delete" | "import"
  >("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const fetchLogs = async () => {
    const sess = await getSession();
    if (!sess || sess.user.role !== Role.ADMIN) {
      console.error("⛔ Session not found!");
      return;
    }
    const res = await axios.get(`${BASE}/admin/logs`, {
      headers: { Authorization: `Bearer ${sess.accessToken}` },
      params: {
        page,
        limit,
        search,
        action: action !== "all" ? action : undefined,
        sortBy,
        order,
      },
    });
    setData(res.data.data);
    setTotal(res.data.total);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, search, action, sortBy, order]);

  const latestUpdate =
    data.length > 0
      ? new Date(data[0].createdAt).toLocaleString("th-TH", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined;

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto">
      {/* Header */}
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">ตรวจสอบ log</h1>
      </div>
      <div className="p-6  rounded-xl bg-white dark:bg-[#1E293B] shadow ">
        {/* Filter */}
        <FilterBar
          search={search}
          setSearchAction={setSearch}
          action={action}
          setAction={setAction}
          sortBy={sortBy}
          order={order}
          setSortAction={(by, ord) => {
            setSortBy(by);
            setOrder(ord);
            setPage(1);
          }}
          limit={limit}
          setLimitAction={(n) => {
            setLimit(n);
            setPage(1);
          }}
        />

        {/* Summary and Table */}
        <LogSummaryBar total={total} lastUpdate={latestUpdate} />
        <LogTable data={data} />

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={Math.ceil(total / limit)}
          setPageAction={setPage}
          totalItems={total}
          limit={limit}
        />
      </div>
    </div>
  );
}
