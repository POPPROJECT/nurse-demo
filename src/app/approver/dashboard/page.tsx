// app/approver/dashboard/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { BACKEND_URL } from "lib/constants";
import FilterBar from "@/app/components/approver/dashboard/FilterBar";
import SummaryCards from "@/app/components/approver/dashboard/SummaryCards";
import StudentListModal from "@/app/components/approver/dashboard/StudentListModal";
import LoadingSpinner from "@/app/components/approver/dashboard/LoadingSpinner";
import ErrorDisplay from "@/app/components/approver/dashboard/ErrorDisplay";
import SelectPrompt from "@/app/components/approver/dashboard/SelectPromt";
import CategoryView from "@/app/components/approver/dashboard/CategoryView";
import SubcategoryView from "@/app/components/approver/dashboard/SubcategoryView";
import {
  Book,
  CourseProgress,
  DashboardData,
  Student,
} from "../../../../lib/type";
import ProgressLegend from "@/app/components/approver/dashboard/ProgressLegend";

// Define the view modes based on your backend logic
type ViewMode = "OVERALL" | "BY_SUBJECT";

export default function UnifiedDashboardPage() {
  const { accessToken } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState<number | "">("");
  const [viewMode, setViewMode] = useState<ViewMode>("OVERALL");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<
    "categories" | "subcategories"
  >("categories");
  const [selectedCourse, setSelectedCourse] = useState<CourseProgress | null>(
    null,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalStudents, setModalStudents] = useState<Student[]>([]);

  // Fetch available books
  useEffect(() => {
    if (!accessToken) return;
    fetch(`${BACKEND_URL}/experience-books`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load book list");
        return res.json();
      })
      .then(setBooks)
      .catch(() => setError("ไม่สามารถโหลดรายการสมุดได้"));
  }, [accessToken]);

  // Fetch dashboard data when filters change
  const fetchDashboardData = useCallback(() => {
    if (!bookId || !accessToken) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    setCurrentView("categories"); // Reset to main view on new fetch

    const url = `${BACKEND_URL}/approver/dashboard?bookId=${bookId}&filterMode=${viewMode}`;

    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => {
        if (!res.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองอีกครั้ง");
        }
        return res.json();
      })
      .then((dashboardData: DashboardData) => {
        setData(dashboardData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookId, viewMode, accessToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [bookId, viewMode, fetchDashboardData]);

  // --- Event Handlers ---
  const handleSelectCourse = (course: CourseProgress) => {
    setSelectedCourse(course);
    setCurrentView("subcategories");
  };

  const handleBackToCategories = () => {
    setCurrentView("categories");
    setSelectedCourse(null);
  };

  const handleOpenStudentModal = async (
    categoryId: number,
    title: string,
    type: "course" | "subcategory",
  ) => {
    if (!bookId || !accessToken) return;
    setModalTitle(title);
    setIsModalOpen(true);
    setIsModalLoading(true);
    setModalStudents([]);
    try {
      const url = `${BACKEND_URL}/approver/dashboard/students?bookId=${bookId}&categoryId=${categoryId}&type=${type}&viewMode=${viewMode}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch student list");
      setModalStudents(await res.json());
    } catch (err) {
      console.error(err);
      // Optionally set an error state for the modal
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleRefresh = () => {
    if (bookId) {
      fetchDashboardData();
    }
  };

  const dynamicTitle =
    viewMode === "OVERALL"
      ? "ภาพรวมความคืบหน้าตลอดหลักสูตร"
      : "ภาพรวมความคืบหน้าในวิชา";

  return (
    <div className="container max-w-7xl px-4 py-8 mx-auto">
      {/* Header */}
      <div
        className="flex justify-between items-center p-4 mb-6 text-white rounded-xl shadow-lg"
        style={{ background: "linear-gradient(to right, #f46b45, #eea849)" }}
      >
        <h1 className="text-xl font-semibold sm:text-2xl">
          {/* ✅ 2. นำตัวแปร dynamicTitle มาใช้ใน h1 */}
          {dynamicTitle}
        </h1>
      </div>

      <FilterBar
        books={books}
        bookId={bookId}
        setBookId={setBookId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefresh={handleRefresh}
      />

      <div className="mt-6">
        {loading && <LoadingSpinner />}
        {!loading && error && (
          <ErrorDisplay message={error} onRetry={handleRefresh} />
        )}
        {!loading && !data && !bookId && <SelectPrompt />}

        {!loading && data && (
          <div className="space-y-8">
            <SummaryCards data={data} />

            {currentView === "categories" ? (
              <div className="space-y-6">
                <ProgressLegend />
                <CategoryView
                  courseProgress={data.courseProgress}
                  onSelectCourse={handleSelectCourse}
                  onViewStudents={(id, title) =>
                    handleOpenStudentModal(id, title, "course")
                  }
                />
              </div>
            ) : (
              selectedCourse && (
                <SubcategoryView
                  course={selectedCourse}
                  onBack={handleBackToCategories}
                  onViewStudents={(id, title) =>
                    handleOpenStudentModal(id, title, "subcategory")
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      <StudentListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        students={modalStudents}
        isLoading={isModalLoading}
      />
    </div>
  );
}
